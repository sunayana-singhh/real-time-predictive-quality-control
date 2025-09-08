import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DateRangeConfig, TrainingResult } from '../../models/dataset.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <!-- Header -->
        <div class="card">
          <div class="card-header">
            <h4 class="mb-0">
              <i class="fas fa-brain me-2"></i>
              Step 3: Model Training & Evaluation
            </h4>
          </div>
          <div class="card-body">
            <p class="text-muted">
              Train the machine learning model using the configured training and testing datasets.
            </p>
          </div>
        </div>

        <!-- Training Controls -->
        <div class="card" *ngIf="!trainingResult">
          <div class="card-body text-center">
            <div class="mb-4">
              <i class="fas fa-robot fa-3x text-primary mb-3"></i>
              <h5>Ready to Train Model</h5>
              <p class="text-muted">
                Click the button below to start training the XGBoost model with your configured datasets.
              </p>
            </div>
            
            <button class="btn btn-primary btn-lg" 
                    (click)="trainModel()"
                    [disabled]="isTraining">
              <i class="fas fa-play me-2" *ngIf="!isTraining"></i>
              <i class="fas fa-spinner fa-spin me-2" *ngIf="isTraining"></i>
              {{ isTraining ? 'Training Model...' : 'Train Model' }}
            </button>

            <!-- Training Progress -->
            <div class="mt-4" *ngIf="isTraining">
              <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     [style.width.%]="trainingProgress">
                  {{ trainingProgress }}%
                </div>
              </div>
              <p class="text-center mt-2">
                <i class="fas fa-cog fa-spin me-2"></i>
                Training in progress...
              </p>
            </div>

            <!-- Error Message -->
            <div class="alert alert-danger mt-3" *ngIf="errorMessage">
              <i class="fas fa-exclamation-triangle me-2"></i>
              {{ errorMessage }}
            </div>
          </div>
        </div>

        <!-- Training Results -->
        <div class="fade-in" *ngIf="trainingResult">
          <!-- Success Message -->
          <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>
            <strong>Model Trained Successfully!</strong> The model has been trained and evaluated.
          </div>

          <!-- Performance Metrics -->
          <div class="row">
            <div class="col-md-3">
              <div class="card metrics-card">
                <div class="card-body text-center">
                  <div class="metrics-value text-primary">{{ trainingResult.accuracy | percent:'1.1-1' }}</div>
                  <div class="metrics-label">Accuracy</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card metrics-card">
                <div class="card-body text-center">
                  <div class="metrics-value text-success">{{ trainingResult.precision | percent:'1.1-1' }}</div>
                  <div class="metrics-label">Precision</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card metrics-card">
                <div class="card-body text-center">
                  <div class="metrics-value text-warning">{{ trainingResult.recall | percent:'1.1-1' }}</div>
                  <div class="metrics-label">Recall</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card metrics-card">
                <div class="card-body text-center">
                  <div class="metrics-value text-info">{{ trainingResult.f1Score | percent:'1.1-1' }}</div>
                  <div class="metrics-label">F1-Score</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Training Charts -->
          <div class="row mt-4">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="fas fa-chart-line me-2"></i>
                    Training Progress
                  </h5>
                </div>
                <div class="card-body">
                  <div class="chart-container">
                    <canvas #trainingChart></canvas>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="fas fa-chart-pie me-2"></i>
                    Confusion Matrix
                  </h5>
                </div>
                <div class="card-body">
                  <div class="chart-container">
                    <canvas #confusionChart></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Model Performance Summary -->
          <div class="card mt-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-info-circle me-2"></i>
                Model Performance Summary
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Confusion Matrix Details</h6>
                  <ul class="list-unstyled">
                    <li><span class="badge bg-success me-2">TP</span> True Positives: {{ trainingResult.confusionMatrix.truePositives | number }}</li>
                    <li><span class="badge bg-danger me-2">TN</span> True Negatives: {{ trainingResult.confusionMatrix.trueNegatives | number }}</li>
                    <li><span class="badge bg-warning me-2">FP</span> False Positives: {{ trainingResult.confusionMatrix.falsePositives | number }}</li>
                    <li><span class="badge bg-info me-2">FN</span> False Negatives: {{ trainingResult.confusionMatrix.falseNegatives | number }}</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h6>Model Quality</h6>
                  <div class="progress mb-2">
                    <div class="progress-bar bg-success" 
                         [style.width.%]="trainingResult.accuracy * 100">
                      Accuracy: {{ trainingResult.accuracy | percent:'1.1-1' }}
                    </div>
                  </div>
                  <div class="progress mb-2">
                    <div class="progress-bar bg-primary" 
                         [style.width.%]="trainingResult.precision * 100">
                      Precision: {{ trainingResult.precision | percent:'1.1-1' }}
                    </div>
                  </div>
                  <div class="progress mb-2">
                    <div class="progress-bar bg-warning" 
                         [style.width.%]="trainingResult.recall * 100">
                      Recall: {{ trainingResult.recall | percent:'1.1-1' }}
                    </div>
                  </div>
                  <div class="progress">
                    <div class="progress-bar bg-info" 
                         [style.width.%]="trainingResult.f1Score * 100">
                      F1-Score: {{ trainingResult.f1Score | percent:'1.1-1' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="row mt-4">
          <div class="col-12 text-center">
            <button class="btn btn-secondary me-3" 
                    (click)="goBack()">
              <i class="fas fa-arrow-left me-2"></i>
              Back to Date Ranges
            </button>
            <button class="btn btn-success btn-lg" 
                    (click)="proceedToNextStep()"
                    [disabled]="!trainingResult">
              <i class="fas fa-arrow-right me-2"></i>
              Proceed to Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-card {
      border-left: 4px solid #007bff;
    }
    
    .metrics-card:nth-child(2) {
      border-left-color: #28a745;
    }
    
    .metrics-card:nth-child(3) {
      border-left-color: #ffc107;
    }
    
    .metrics-card:nth-child(4) {
      border-left-color: #17a2b8;
    }
    
    .chart-container {
      height: 250px;
      position: relative;
    }
    
    .progress {
      height: 20px;
    }
  `]
})
export class TrainingComponent implements OnInit, AfterViewInit {
  @ViewChild('trainingChart', { static: false }) trainingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confusionChart', { static: false }) confusionChartRef!: ElementRef<HTMLCanvasElement>;

  trainingResult: TrainingResult | null = null;
  isTraining = false;
  trainingProgress = 0;
  errorMessage = '';
  
  private trainingChart: Chart | null = null;
  private confusionChart: Chart | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Register Chart.js components
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // Check if we have the required configuration
    const dateConfig = this.apiService.getCurrentDateRangeConfig();
    if (!dateConfig) {
      this.router.navigate(['/date-ranges']);
      return;
    }

    // Load existing training result if available
    this.trainingResult = this.apiService.getCurrentTrainingResult();
    
    // If we have existing results, draw charts after view init
    if (this.trainingResult) {
      setTimeout(() => this.drawCharts(), 100);
    }
  }

  ngAfterViewInit(): void {
    // Charts will be initialized when training completes
  }

  trainModel(): void {
    const dateConfig = this.apiService.getCurrentDateRangeConfig();
    if (!dateConfig) {
      this.errorMessage = 'Date range configuration not found. Please go back and configure date ranges.';
      return;
    }

    this.isTraining = true;
    this.trainingProgress = 0;
    this.errorMessage = '';

    // Simulate training progress
    const progressInterval = setInterval(() => {
      if (this.trainingProgress < 90) {
        this.trainingProgress += Math.random() * 15;
      }
    }, 500);

    this.apiService.trainModel(dateConfig).subscribe({
      next: (result) => {
        clearInterval(progressInterval);
        this.trainingProgress = 100;
        this.trainingResult = result;
        this.isTraining = false;
        
        // Draw charts after a short delay
        setTimeout(() => {
          this.drawCharts();
        }, 100);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.errorMessage = error.error?.message || 'Failed to train model. Please try again.';
        this.isTraining = false;
        this.trainingProgress = 0;
      }
    });
  }

  private drawCharts(): void {
    this.drawTrainingChart();
    this.drawConfusionChart();
  }

  private drawTrainingChart(): void {
    if (!this.trainingResult?.trainingChartData || !this.trainingChartRef?.nativeElement) {
      return;
    }

    // Wait a bit for the DOM to be ready
    setTimeout(() => {
      if (!this.trainingChartRef?.nativeElement) {
        setTimeout(() => this.drawTrainingChart(), 100);
        return;
      }

      // Destroy existing chart if it exists
      if (this.trainingChart) {
        this.trainingChart.destroy();
      }

      const ctx = this.trainingChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      const chartData = this.trainingResult!.trainingChartData;

      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: chartData.datasets.map(dataset => ({
            label: dataset.label,
            data: dataset.data,
            borderColor: dataset.borderColor,
            backgroundColor: dataset.backgroundColor,
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: dataset.borderColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            title: {
              display: true,
              text: 'Training Progress Over Time',
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: 20
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              cornerRadius: 8,
              callbacks: {
                title: function(context) {
                  return `Epoch ${context[0].label}`;
                },
                label: function(context) {
                  const value = typeof context.parsed.y === 'number' ? 
                    (context.parsed.y * 100).toFixed(2) + '%' : 
                    context.parsed.y;
                  return `${context.dataset.label}: ${value}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Epoch',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Value',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              },
              beginAtZero: true,
              max: 1,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return typeof value === 'number' ? (value * 100).toFixed(0) + '%' : value;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      };

      this.trainingChart = new Chart(ctx, config);
    }, 50);
  }

  private drawConfusionChart(): void {
    if (!this.trainingResult?.confusionMatrix || !this.confusionChartRef?.nativeElement) {
      return;
    }

    // Wait a bit for the DOM to be ready
    setTimeout(() => {
      if (!this.confusionChartRef?.nativeElement) {
        setTimeout(() => this.drawConfusionChart(), 100);
        return;
      }

      // Destroy existing chart if it exists
      if (this.confusionChart) {
        this.confusionChart.destroy();
      }

      const ctx = this.confusionChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      const confusionMatrix = this.trainingResult!.confusionMatrix;
      
      const data = [
        confusionMatrix.truePositives,
        confusionMatrix.trueNegatives,
        confusionMatrix.falsePositives,
        confusionMatrix.falseNegatives
      ];

      const labels = ['True Positives', 'True Negatives', 'False Positives', 'False Negatives'];
      const colors = [
        'rgba(40, 167, 69, 0.8)',   // Green for TP
        'rgba(23, 162, 184, 0.8)',  // Blue for TN
        'rgba(255, 193, 7, 0.8)',   // Yellow for FP
        'rgba(220, 53, 69, 0.8)'    // Red for FN
      ];

      const borderColors = [
        'rgba(40, 167, 69, 1)',
        'rgba(23, 162, 184, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(220, 53, 69, 1)'
      ];

      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 3,
            hoverBorderWidth: 5,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            title: {
              display: true,
              text: 'Confusion Matrix Distribution',
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: 20
            },
            legend: {
              display: true,
              position: 'right',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 11
                },
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels?.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i];
                      const backgroundColor = Array.isArray(data.datasets[0].backgroundColor) ? 
                        data.datasets[0].backgroundColor[i] : data.datasets[0].backgroundColor;
                      const borderColor = Array.isArray(data.datasets[0].borderColor) ? 
                        data.datasets[0].borderColor[i] : data.datasets[0].borderColor;
                      return {
                        text: `${label}: ${value}`,
                        fillStyle: backgroundColor as string,
                        strokeStyle: borderColor as string,
                        lineWidth: 2,
                        pointStyle: 'circle'
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a: number, b: any) => {
                    const numB = typeof b === 'number' ? b : 0;
                    return a + numB;
                  }, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      };

      this.confusionChart = new Chart(ctx, config);
    }, 50);
  }

  goBack(): void {
    this.router.navigate(['/date-ranges']);
  }

  proceedToNextStep(): void {
    if (this.trainingResult) {
      this.router.navigate(['/simulation']);
    }
  }
}
