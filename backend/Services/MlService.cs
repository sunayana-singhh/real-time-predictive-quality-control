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

            // Get training and testing data
            var trainingStart = DateTime.Parse(config.Training.StartDate);
            var trainingEnd = DateTime.Parse(config.Training.EndDate);
            var testingStart = DateTime.Parse(config.Testing.StartDate);
            var testingEnd = DateTime.Parse(config.Testing.EndDate);

            var trainingData = await _context.DatasetRecords
                .Where(r => r.SyntheticTimestamp >= trainingStart && r.SyntheticTimestamp <= trainingEnd)
                .ToListAsync();

            var testingData = await _context.DatasetRecords
                .Where(r => r.SyntheticTimestamp >= testingStart && r.SyntheticTimestamp <= testingEnd)
                .ToListAsync();

            // Prepare training request
            var trainingRequest = new
            {
                trainStart = config.Training.StartDate,
                trainEnd = config.Training.EndDate,
                testStart = config.Testing.StartDate,
                testEnd = config.Testing.EndDate,
                trainingData = trainingData.Select(r => new
                {
                    timestamp = r.SyntheticTimestamp.ToString("yyyy-MM-ddTHH:mm:ss"),
                    response = r.Response,
                    features = r.Features
                }).ToList(),
                testingData = testingData.Select(r => new
                {
                    timestamp = r.SyntheticTimestamp.ToString("yyyy-MM-ddTHH:mm:ss"),
                    response = r.Response,
                    features = r.Features
                }).ToList()
            };

            var json = JsonSerializer.Serialize(trainingRequest);
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

            var simulationData = await _context.DatasetRecords
                .Where(r => r.SyntheticTimestamp >= simulationStart && r.SyntheticTimestamp <= simulationEnd)
                .OrderBy(r => r.SyntheticTimestamp)
                .ToListAsync();

            // Prepare simulation request
            var simulationRequest = new
            {
                simulationStart = config.Simulation.StartDate,
                simulationEnd = config.Simulation.EndDate,
                data = simulationData.Select(r => new
                {
                    timestamp = r.SyntheticTimestamp.ToString("yyyy-MM-ddTHH:mm:ss"),
                    id = r.Id,
                    response = r.Response,
                    features = r.Features
                }).ToList()
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
