// Dataset metadata model
export interface DatasetMetadata {
  fileName: string;
  totalRecords: number;
  totalColumns: number;
  passRate: number;
  dateRange: {
    start: string;
    end: string;
  };
}

// Date range configuration
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateRangeConfig {
  training: DateRange;
  testing: DateRange;
  simulation: DateRange;
}

// Date range validation result
export interface DateRangeValidation {
  isValid: boolean;
  message: string;
  trainingRecords: number;
  testingRecords: number;
  simulationRecords: number;
  monthlyBreakdown: MonthlyData[];
}

export interface MonthlyData {
  month: string;
  training: number;
  testing: number;
  simulation: number;
}

// Model training result
export interface TrainingResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingChartData: ChartData;
  confusionMatrix: ConfusionMatrix;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface ConfusionMatrix {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

// Simulation data
export interface SimulationResult {
  timestamp: string;
  sampleId: string;
  prediction: 'Pass' | 'Fail';
  confidence: number;
  temperature: number;
  pressure: number;
  humidity: number;
}

export interface SimulationStats {
  totalPredictions: number;
  passCount: number;
  failCount: number;
  averageConfidence: number;
}
