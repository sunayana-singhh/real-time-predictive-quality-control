using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using IntelliInspect.Backend.Models;
using IntelliInspect.Backend.Data;
using System.IO;
using System.Globalization;
using System.Linq;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;

namespace IntelliInspect.Backend.Services
{
    public class DatasetService : IDatasetService
    {
        private readonly ApplicationDbContext _db;

        public DatasetService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<DatasetMetadata> ProcessUploadedFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("No file provided");
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Only CSV files are supported");
            }

            var featureNames = new List<string>();
            DateTime baseDateTime = DateTime.UtcNow.AddDays(-365); // Start from a year ago
            
            // Batch processing configuration for large datasets
            const int BATCH_SIZE = 1000;  // Process 1000 records at a time
            const int MAX_RECORDS = 100000; // Limit to 100k records to prevent OOM
            
            var batchRecords = new List<DatasetRecord>(BATCH_SIZE);
            int totalRecordsProcessed = 0;
            int passCount = 0;
            DateTime? minDate = null;
            DateTime? maxDate = null;

            using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

            // Read header
            csv.Read();
            csv.ReadHeader();
            var headers = csv.HeaderRecord;
            
            if (headers == null || headers.Length == 0)
            {
                throw new ArgumentException("CSV file must contain headers");
            }

            // Extract feature names (all columns except 'Response')
            featureNames = headers.Where(h => h != "Response").ToList();
            
            if (!headers.Contains("Response"))
            {
                throw new ArgumentException("CSV file must contain a 'Response' column");
            }

            // Clear existing data efficiently
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM DatasetRecords");

            // Process data rows in batches
            int recordIndex = 0;
            while (csv.Read() && totalRecordsProcessed < MAX_RECORDS)
            {
                var features = new Dictionary<string, double>();
                int response = 0;

                // Parse each column
                foreach (var header in headers)
                {
                    var value = csv.GetField(header);
                    
                    if (header == "Response")
                    {
                        if (!int.TryParse(value, out response))
                        {
                            // Skip invalid records instead of throwing
                            continue;
                        }
                    }
                    else
                    {
                        // Handle missing/empty values in feature columns
                        if (string.IsNullOrWhiteSpace(value) || !double.TryParse(value, out double featureValue))
                        {
                            // Set missing values to 0 (common practice in ML)
                            featureValue = 0.0;
                        }
                        features[header] = featureValue;
                    }
                }

                // Create synthetic timestamp (spread records over time)
                var syntheticTimestamp = baseDateTime.AddHours(recordIndex * 0.5); // 30 minutes between records

                var record = new DatasetRecord
                {
                    SyntheticTimestamp = syntheticTimestamp,
                    Response = response,
                    Features = features
                };

                batchRecords.Add(record);
                
                // Track statistics
                if (response == 1) passCount++;
                if (minDate == null || syntheticTimestamp < minDate) minDate = syntheticTimestamp;
                if (maxDate == null || syntheticTimestamp > maxDate) maxDate = syntheticTimestamp;
                
                recordIndex++;
                totalRecordsProcessed++;

                // Process batch when full
                if (batchRecords.Count >= BATCH_SIZE)
                {
                    await SaveBatchAsync(batchRecords);
                    batchRecords.Clear();
                    
                    // Force garbage collection after each batch
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                }
            }

            // Process remaining records
            if (batchRecords.Count > 0)
            {
                await SaveBatchAsync(batchRecords);
                batchRecords.Clear();
            }

            // Calculate metadata using the tracked values
            var totalColumns = featureNames.Count + 1; // +1 for Response column
            var passRate = totalRecordsProcessed > 0 ? (double)passCount / totalRecordsProcessed : 0;

            var metadata = new DatasetMetadata
            {
                FileName = file.FileName,
                TotalRecords = totalRecordsProcessed,
                TotalColumns = totalColumns,
                PassRate = Math.Round(passRate, 4), // Round to 4 decimal places for percentage precision
                DateRange = new SimpleDateRange
                {
                    Start = (minDate ?? DateTime.UtcNow).ToString("yyyy-MM-dd"),
                    End = (maxDate ?? DateTime.UtcNow).ToString("yyyy-MM-dd")
                }
            };

            return metadata;
        }

        /// <summary>
        /// Save a batch of records to the database efficiently
        /// </summary>
        private async Task SaveBatchAsync(List<DatasetRecord> batchRecords)
        {
            if (batchRecords == null || batchRecords.Count == 0)
                return;
                
            try 
            {
                _db.DatasetRecords.AddRange(batchRecords);
                await _db.SaveChangesAsync();
                
                // Clear the change tracker to free memory
                _db.ChangeTracker.Clear();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to save batch of {batchRecords.Count} records", ex);
            }
        }

        public async Task<DateRangeValidation> ValidateDateRangesAsync(DateRangeConfig config)
        {
            try
            {
                // Parse dates
                if (!DateTime.TryParse(config.Training.StartDate, out var trainingStart) ||
                    !DateTime.TryParse(config.Training.EndDate, out var trainingEnd) ||
                    !DateTime.TryParse(config.Testing.StartDate, out var testingStart) ||
                    !DateTime.TryParse(config.Testing.EndDate, out var testingEnd) ||
                    !DateTime.TryParse(config.Simulation.StartDate, out var simulationStart) ||
                    !DateTime.TryParse(config.Simulation.EndDate, out var simulationEnd))
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "Invalid date format provided",
                        TrainingRecords = 0,
                        TestingRecords = 0,
                        SimulationRecords = 0,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                // Validate date range logic
                if (trainingStart > trainingEnd)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "Training end date must be after start date",
                        TrainingRecords = 0,
                        TestingRecords = 0,
                        SimulationRecords = 0,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                if (testingStart > testingEnd)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "Testing end date must be after start date",
                        TrainingRecords = 0,
                        TestingRecords = 0,
                        SimulationRecords = 0,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                if (simulationStart > simulationEnd)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "Simulation end date must be after start date",
                        TrainingRecords = 0,
                        TestingRecords = 0,
                        SimulationRecords = 0,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                // Check for overlapping periods (allow flexibility for small datasets)
                bool hasOverlappingTrainingTesting = trainingStart <= testingEnd && testingStart <= trainingEnd;
                bool hasOverlappingTestingSimulation = testingStart <= simulationEnd && simulationStart <= testingEnd;
                
                // For small datasets, allow same-day periods but warn about overlaps
                bool isSmallDataset = (simulationEnd - trainingStart).TotalDays <= 3;
                
                if (hasOverlappingTrainingTesting && !isSmallDataset)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "Training and testing periods cannot overlap for larger datasets",
                        TrainingRecords = 0,
                        TestingRecords = 0,
                        SimulationRecords = 0,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                if (hasOverlappingTestingSimulation && testingStart == testingEnd && simulationStart == simulationEnd && testingStart != simulationStart)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "Testing and simulation periods should use the same date for small datasets or be sequential",
                        TrainingRecords = 0,
                        TestingRecords = 0,
                        SimulationRecords = 0,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                // Count records efficiently using database queries (avoid loading into memory)
                var trainingRecords = await _db.DatasetRecords
                    .Where(r => r.SyntheticTimestamp.Date >= trainingStart.Date && 
                                r.SyntheticTimestamp.Date <= trainingEnd.Date)
                    .CountAsync();

                var testingRecords = await _db.DatasetRecords
                    .Where(r => r.SyntheticTimestamp.Date >= testingStart.Date && 
                                r.SyntheticTimestamp.Date <= testingEnd.Date)
                    .CountAsync();

                var simulationRecords = await _db.DatasetRecords
                    .Where(r => r.SyntheticTimestamp.Date >= simulationStart.Date && 
                                r.SyntheticTimestamp.Date <= simulationEnd.Date)
                    .CountAsync();

                // Check if we have enough records
                if (trainingRecords == 0)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "No records found in training period. Please adjust the training date range.",
                        TrainingRecords = trainingRecords,
                        TestingRecords = testingRecords,
                        SimulationRecords = simulationRecords,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                if (testingRecords == 0 && !isSmallDataset)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "No records found in testing period. Please adjust the testing date range.",
                        TrainingRecords = trainingRecords,
                        TestingRecords = testingRecords,
                        SimulationRecords = simulationRecords,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                if (simulationRecords == 0 && !isSmallDataset)
                {
                    return new DateRangeValidation
                    {
                        IsValid = false,
                        Message = "No records found in simulation period. Please adjust the simulation date range.",
                        TrainingRecords = trainingRecords,
                        TestingRecords = testingRecords,
                        SimulationRecords = simulationRecords,
                        MonthlyBreakdown = new List<MonthlyData>()
                    };
                }

                // Create simplified monthly breakdown for large datasets
                var monthlyBreakdown = new List<MonthlyData>();
                
                // For large datasets, create a simplified breakdown to avoid memory issues
                var totalRecords = trainingRecords + testingRecords + simulationRecords;
                
                if (totalRecords > 10000) // For large datasets, provide simplified breakdown
                {
                    // Create monthly entries based on date ranges only
                    var trainingMonth = trainingStart.ToString("MMM yyyy");
                    var testingMonth = testingStart.ToString("MMM yyyy");
                    var simulationMonth = simulationStart.ToString("MMM yyyy");
                    
                    var months = new[] { trainingMonth, testingMonth, simulationMonth }.Distinct().ToList();
                    
                    foreach (var month in months)
                    {
                        monthlyBreakdown.Add(new MonthlyData 
                        { 
                            Month = month,
                            Training = month == trainingMonth ? trainingRecords : 0,
                            Testing = month == testingMonth ? testingRecords : 0,
                            Simulation = month == simulationMonth ? simulationRecords : 0
                        });
                    }
                }
                else 
                {
                    // For smaller datasets, provide detailed monthly breakdown
                    var minDate = new[] { trainingStart, testingStart, simulationStart }.Min();
                    var maxDate = new[] { trainingEnd, testingEnd, simulationEnd }.Max();
                    
                    var currentDate = new DateTime(minDate.Year, minDate.Month, 1);
                    var endDate = new DateTime(maxDate.Year, maxDate.Month, 1);
                    
                    while (currentDate <= endDate)
                    {
                        var monthKey = currentDate.ToString("MMM yyyy");
                        var monthStart = currentDate;
                        var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                        
                        var monthTrainingCount = await _db.DatasetRecords
                            .Where(r => r.SyntheticTimestamp.Date >= monthStart.Date && 
                                       r.SyntheticTimestamp.Date <= monthEnd.Date &&
                                       r.SyntheticTimestamp.Date >= trainingStart.Date && 
                                       r.SyntheticTimestamp.Date <= trainingEnd.Date)
                            .CountAsync();
                            
                        var monthTestingCount = await _db.DatasetRecords
                            .Where(r => r.SyntheticTimestamp.Date >= monthStart.Date && 
                                       r.SyntheticTimestamp.Date <= monthEnd.Date &&
                                       r.SyntheticTimestamp.Date >= testingStart.Date && 
                                       r.SyntheticTimestamp.Date <= testingEnd.Date)
                            .CountAsync();
                            
                        var monthSimulationCount = await _db.DatasetRecords
                            .Where(r => r.SyntheticTimestamp.Date >= monthStart.Date && 
                                       r.SyntheticTimestamp.Date <= monthEnd.Date &&
                                       r.SyntheticTimestamp.Date >= simulationStart.Date && 
                                       r.SyntheticTimestamp.Date <= simulationEnd.Date)
                            .CountAsync();
                        
                        monthlyBreakdown.Add(new MonthlyData 
                        { 
                            Month = monthKey,
                            Training = monthTrainingCount,
                            Testing = monthTestingCount,
                            Simulation = monthSimulationCount
                        });
                        
                        currentDate = currentDate.AddMonths(1);
                    }
                }

                return new DateRangeValidation
                {
                    IsValid = true,
                    Message = $"Date ranges validated successfully. Training: {trainingRecords}, Testing: {testingRecords}, Simulation: {simulationRecords} records.",
                    TrainingRecords = trainingRecords,
                    TestingRecords = testingRecords,
                    SimulationRecords = simulationRecords,
                    MonthlyBreakdown = monthlyBreakdown
                };
            }
            catch (Exception ex)
            {
                return new DateRangeValidation
                {
                    IsValid = false,
                    Message = $"Validation error: {ex.Message}",
                    TrainingRecords = 0,
                    TestingRecords = 0,
                    SimulationRecords = 0,
                    MonthlyBreakdown = new List<MonthlyData>()
                };
            }
        }

        public async Task<List<DatasetRecord>> GetRecordsInDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            // Example: fetch records from DbContext
            var records = await Task.FromResult(new List<DatasetRecord>());
            return records;
        }

        public async Task<List<MonthlyData>> GetMonthlyBreakdownAsync(DateRangeConfig config)
        {
            // TODO: Implement monthly breakdown logic
            return await Task.FromResult(new List<MonthlyData>());
        }
    }
}
