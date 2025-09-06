namespace IntelliInspect.Backend.Models;

/// <summary>
/// Dataset metadata information
/// </summary>
public class DatasetMetadata
{
    public string FileName { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int TotalColumns { get; set; }
    public double PassRate { get; set; }
    public DateRange DateRange { get; set; } = new();
}

/// <summary>
/// Date range information
/// </summary>
public class DateRange
{
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
}

/// <summary>
/// Date range configuration for training, testing, and simulation
/// </summary>
public class DateRangeConfig
{
    public DateRange Training { get; set; } = new();
    public DateRange Testing { get; set; } = new();
    public DateRange Simulation { get; set; } = new();
}

/// <summary>
/// Date range validation result
/// </summary>
public class DateRangeValidation
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TrainingRecords { get; set; }
    public int TestingRecords { get; set; }
    public int SimulationRecords { get; set; }
    public List<MonthlyData> MonthlyBreakdown { get; set; } = new();
}

/// <summary>
/// Monthly data breakdown
/// </summary>
public class MonthlyData
{
    public string Month { get; set; } = string.Empty;
    public int Training { get; set; }
    public int Testing { get; set; }
    public int Simulation { get; set; }
}

/// <summary>
/// Model training result
/// </summary>
public class TrainingResult
{
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
    public TrainingChartData TrainingChartData { get; set; } = new();
    public ConfusionMatrix ConfusionMatrix { get; set; } = new();
}

/// <summary>
/// Training chart data
/// </summary>
public class TrainingChartData
{
    public List<string> Labels { get; set; } = new();
    public List<ChartDataset> Datasets { get; set; } = new();
}

/// <summary>
/// Chart dataset
/// </summary>
public class ChartDataset
{
    public string Label { get; set; } = string.Empty;
    public List<double> Data { get; set; } = new();
    public string BorderColor { get; set; } = string.Empty;
    public string BackgroundColor { get; set; } = string.Empty;
}

/// <summary>
/// Confusion matrix data
/// </summary>
public class ConfusionMatrix
{
    public int TruePositives { get; set; }
    public int TrueNegatives { get; set; }
    public int FalsePositives { get; set; }
    public int FalseNegatives { get; set; }
}

/// <summary>
/// Simulation result for a single prediction
/// </summary>
public class SimulationResult
{
    public string Timestamp { get; set; } = string.Empty;
    public string SampleId { get; set; } = string.Empty;
    public string Prediction { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public double Temperature { get; set; }
    public double Pressure { get; set; }
    public double Humidity { get; set; }
}

/// <summary>
/// Simulation statistics
/// </summary>
public class SimulationStats
{
    public int TotalPredictions { get; set; }
    public int PassCount { get; set; }
    public int FailCount { get; set; }
    public double AverageConfidence { get; set; }
}

/// <summary>
/// Dataset record with synthetic timestamp
/// </summary>
public class DatasetRecord
{
    public int Id { get; set; }
    public DateTime SyntheticTimestamp { get; set; }
    public int Response { get; set; }
    public Dictionary<string, double> Features { get; set; } = new();
}
