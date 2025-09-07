using IntelliInspect.Backend.Data;
using IntelliInspect.Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace IntelliInspect.Backend.Services;

/// <summary>
/// Service for ML operations, communicates with Python ML service
/// </summary>
public class MlService : IMlService
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<MlService> _logger;
    private readonly string _mlServiceUrl;

    public MlService(HttpClient httpClient, ApplicationDbContext context, ILogger<MlService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _context = context;
        _logger = logger;
        _mlServiceUrl = configuration["ML_SERVICE_URL"] ?? "http://ml-service:8000";
    }

    /// <summary>
    /// Train the ML model with the specified date ranges
    /// </summary>
    public async Task<TrainingResult> TrainModelAsync(DateRangeConfig config)
    {
        try
        {
            _logger.LogInformation("Starting model training with date ranges");

            // Get training and testing data - ensure we capture full days
            var trainingStart = DateTime.Parse(config.Training.StartDate).Date; // Start of day
            var trainingEnd = DateTime.Parse(config.Training.EndDate).Date.AddDays(1).AddTicks(-1); // End of day
            var testingStart = DateTime.Parse(config.Testing.StartDate).Date; // Start of day
            var testingEnd = DateTime.Parse(config.Testing.EndDate).Date.AddDays(1).AddTicks(-1); // End of day

            _logger.LogInformation($"Parsed date ranges - Training: {trainingStart:yyyy-MM-dd} to {trainingEnd:yyyy-MM-dd}, Testing: {testingStart:yyyy-MM-dd} to {testingEnd:yyyy-MM-dd}");

            // Check what data exists in database
            var totalRecords = await _context.DatasetRecords.CountAsync();
            var minDate = await _context.DatasetRecords.MinAsync(r => r.SyntheticTimestamp);
            var maxDate = await _context.DatasetRecords.MaxAsync(r => r.SyntheticTimestamp);
            _logger.LogInformation($"Database contains {totalRecords} records from {minDate:yyyy-MM-dd HH:mm:ss} to {maxDate:yyyy-MM-dd HH:mm:ss}");

            // Further limit dataset size to prevent JSON serialization OOM 
            const int MAX_TRAINING_RECORDS = 2000;
            const int MAX_TESTING_RECORDS = 1000;

            // Get training data with limit and efficient JSON handling
            var trainingRecords = await _context.DatasetRecords
                .Where(r => r.SyntheticTimestamp >= trainingStart && r.SyntheticTimestamp <= trainingEnd)
                .OrderBy(r => r.SyntheticTimestamp)
                .Take(MAX_TRAINING_RECORDS)
                .Select(r => new
                {
                    timestamp = r.SyntheticTimestamp.ToString("yyyy-MM-ddTHH:mm:ss"),
                    response = r.Response,
                    featuresJson = r.FeaturesJson // Get JSON directly, don't deserialize yet
                })
                .ToListAsync();

            var testingRecords = await _context.DatasetRecords
                .Where(r => r.SyntheticTimestamp >= testingStart && r.SyntheticTimestamp <= testingEnd)
                .OrderBy(r => r.SyntheticTimestamp)
                .Take(MAX_TESTING_RECORDS)
                .Select(r => new
                {
                    timestamp = r.SyntheticTimestamp.ToString("yyyy-MM-ddTHH:mm:ss"),
                    response = r.Response,
                    featuresJson = r.FeaturesJson // Get JSON directly, don't deserialize yet
                })
                .ToListAsync();

            _logger.LogInformation($"Retrieved {trainingRecords.Count} training records and {testingRecords.Count} testing records");

            // Process training data efficiently in batches
            var trainingDataProcessed = new List<object>();
            foreach (var record in trainingRecords)
            {
                try
                {
                    // Only deserialize when needed
                    var features = JsonSerializer.Deserialize<Dictionary<string, double>>(record.featuresJson) ?? new Dictionary<string, double>();
                    trainingDataProcessed.Add(new
                    {
                        timestamp = record.timestamp,
                        response = record.response,
                        features = features
                    });
                    
                    // Help GC every 1000 records
                    if (trainingDataProcessed.Count % 1000 == 0)
                    {
                        GC.Collect();
                        GC.WaitForPendingFinalizers();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to process training record: {ex.Message}");
                    continue;
                }
            }

            // Process testing data efficiently  
            var testingDataProcessed = new List<object>();
            foreach (var record in testingRecords)
            {
                try
                {
                    var features = JsonSerializer.Deserialize<Dictionary<string, double>>(record.featuresJson) ?? new Dictionary<string, double>();
                    testingDataProcessed.Add(new
                    {
                        timestamp = record.timestamp,
                        response = record.response,
                        features = features
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to process testing record: {ex.Message}");
                    continue;
                }
            }

            // Clear original records from memory
            trainingRecords.Clear();
            testingRecords.Clear();
            GC.Collect();

            // Prepare training request
            var trainingRequest = new
            {
                trainStart = config.Training.StartDate,
                trainEnd = config.Training.EndDate,
                testStart = config.Testing.StartDate,
                testEnd = config.Testing.EndDate,
                trainingData = trainingDataProcessed,
                testingData = testingDataProcessed
            };

            _logger.LogInformation($"Training data count: {trainingRequest.trainingData.Count}");

            // Use streaming JSON serialization to avoid OOM during large payload serialization
            var json = JsonSerializer.Serialize(trainingRequest, new JsonSerializerOptions
            {
                // Optimize JSON serialization for large payloads
                DefaultBufferSize = 4096,
                WriteIndented = false
            });
            
            _logger.LogInformation($"JSON payload size: ~{json.Length / 1024 / 1024}MB");
            
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Call ML service
            var response = await _httpClient.PostAsync($"{_mlServiceUrl}/train", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<TrainingResult>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            _logger.LogInformation("Model training completed successfully");

            return result ?? new TrainingResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error training model");
            throw;
        }
    }

    /// <summary>
    /// Start simulation with the specified date ranges
    /// </summary>
    public async Task<List<SimulationResult>> StartSimulationAsync(DateRangeConfig config)
    {
        try
        {
            _logger.LogInformation("Starting simulation with date ranges");

            // Get simulation data
            var simulationStart = DateTime.Parse(config.Simulation.StartDate);
            var simulationEnd = DateTime.Parse(config.Simulation.EndDate);

            // Limit simulation data to prevent OOM (consistent with training limits)
            const int MAX_SIMULATION_RECORDS = 1000;
            
            var simulationRecords = await _context.DatasetRecords
                .Where(r => r.SyntheticTimestamp >= simulationStart && r.SyntheticTimestamp <= simulationEnd)
                .OrderBy(r => r.SyntheticTimestamp)
                .Take(MAX_SIMULATION_RECORDS)
                .Select(r => new
                {
                    timestamp = r.SyntheticTimestamp.ToString("yyyy-MM-ddTHH:mm:ss"),
                    id = r.Id,
                    response = r.Response,
                    featuresJson = r.FeaturesJson
                })
                .ToListAsync();

            // Process simulation data efficiently
            var simulationDataProcessed = new List<object>();
            foreach (var record in simulationRecords)
            {
                try
                {
                    var features = JsonSerializer.Deserialize<Dictionary<string, double>>(record.featuresJson) ?? new Dictionary<string, double>();
                    simulationDataProcessed.Add(new
                    {
                        timestamp = record.timestamp,
                        id = record.id,
                        response = record.response,
                        features = features
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to process simulation record: {ex.Message}");
                    continue;
                }
            }

            // Clear original records from memory
            simulationRecords.Clear();
            GC.Collect();

            // Prepare simulation request
            var simulationRequest = new
            {
                simulationStart = config.Simulation.StartDate,
                simulationEnd = config.Simulation.EndDate,
                data = simulationDataProcessed
            };

            var json = JsonSerializer.Serialize(simulationRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Call ML service
            var response = await _httpClient.PostAsync($"{_mlServiceUrl}/simulate", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var results = JsonSerializer.Deserialize<List<SimulationResult>>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            _logger.LogInformation("Simulation completed with {Count} results", results?.Count ?? 0);

            return results ?? new List<SimulationResult>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting simulation");
            throw;
        }
    }

    /// <summary>
    /// Get simulation statistics
    /// </summary>
    public async Task<SimulationStats> GetSimulationStatsAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_mlServiceUrl}/simulation/stats");
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var stats = JsonSerializer.Deserialize<SimulationStats>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return stats ?? new SimulationStats();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting simulation statistics");
            return new SimulationStats();
        }
    }
}

