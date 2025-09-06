using IntelliInspect.Backend.Models;

namespace IntelliInspect.Backend.Services;

/// <summary>
/// Service interface for ML operations
/// </summary>
public interface IMlService
{
    /// <summary>
    /// Train the ML model with the specified date ranges
    /// </summary>
    Task<TrainingResult> TrainModelAsync(DateRangeConfig config);

    /// <summary>
    /// Start simulation with the specified date ranges
    /// </summary>
    Task<List<SimulationResult>> StartSimulationAsync(DateRangeConfig config);

    /// <summary>
    /// Get simulation statistics
    /// </summary>
    Task<SimulationStats> GetSimulationStatsAsync();
}
