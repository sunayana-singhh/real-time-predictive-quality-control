import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DatasetMetadata, DateRangeConfig, DateRangeValidation } from '../../models/dataset.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <!-- Header -->
        <div class="card">
          <div class="card-header">
            <h4 class="mb-0">
              <i class="fas fa-calendar-alt me-2"></i>
              Step 2: Configure Date Ranges
            </h4>
          </div>
          <div class="card-body">
            <p class="text-muted">
              Define the time periods for training, testing, and simulation. 
              All periods must be sequential and non-overlapping.
            </p>
          </div>
        </div>

        <!-- Date Range Configuration -->
        <div class="row">
          <!-- Training Period -->
          <div class="col-md-4">
            <div class="card date-range-card training">
              <div class="card-header bg-success text-white">
                <h5 class="mb-0">
                  <i class="fas fa-graduation-cap me-2"></i>
                  Training Period
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">Start Date</label>
                  <input type="date" 
                         class="form-control" 
                         [(ngModel)]="dateConfig.training.startDate"
                         [min]="minDate"
                         [max]="maxDate">
                </div>
                <div class="mb-3">
                  <label class="form-label">End Date</label>
                  <input type="date" 
                         class="form-control" 
                         [(ngModel)]="dateConfig.training.endDate"
                         [min]="dateConfig.training.startDate"
                         [max]="maxDate">
                </div>
                <div class="text-muted small">
                  <i class="fas fa-info-circle me-1"></i>
                  Used for model training
                </div>
              </div>
            </div>
          </div>

          <!-- Testing Period -->
          <div class="col-md-4">
            <div class="card date-range-card testing">
              <div class="card-header bg-warning text-dark">
                <h5 class="mb-0">
                  <i class="fas fa-vial me-2"></i>
                  Testing Period
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">Start Date</label>
                  <input type="date" 
                         class="form-control" 
                         [(ngModel)]="dateConfig.testing.startDate"
                         [min]="getMinTestingDate()"
                         [max]="maxDate">
                </div>
                <div class="mb-3">
                  <label class="form-label">End Date</label>
                  <input type="date" 
                         class="form-control" 
                         [(ngModel)]="dateConfig.testing.endDate"
                         [min]="dateConfig.testing.startDate"
                         [max]="maxDate">
                </div>
                <div class="text-muted small">
                  <i class="fas fa-info-circle me-1"></i>
                  Used for model evaluation
                </div>
              </div>
            </div>
          </div>

          <!-- Simulation Period -->
          <div class="col-md-4">
            <div class="card date-range-card simulation">
              <div class="card-header bg-info text-white">
                <h5 class="mb-0">
                  <i class="fas fa-play-circle me-2"></i>
                  Simulation Period
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">Start Date</label>
                  <input type="date" 
                         class="form-control" 
                         [(ngModel)]="dateConfig.simulation.startDate"
                         [min]="getMinSimulationDate()"
                         [max]="maxDate">
                </div>
                <div class="mb-3">
                  <label class="form-label">End Date</label>
                  <input type="date" 
                         class="form-control" 
                         [(ngModel)]="dateConfig.simulation.endDate"
                         [min]="dateConfig.simulation.startDate"
                         [max]="maxDate">
                </div>
                <div class="text-muted small">
                  <i class="fas fa-info-circle me-1"></i>
                  Used for real-time simulation
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Controls -->
        <div class="row mt-4">
          <div class="col-12 text-center">
            <button class="btn btn-primary btn-lg" 
                    (click)="validateRanges()"
                    [disabled]="isValidating">
              <i class="fas fa-check-circle me-2" *ngIf="!isValidating"></i>
              <i class="fas fa-spinner fa-spin me-2" *ngIf="isValidating"></i>
              Validate Ranges
            </button>
          </div>
        </div>

        <!-- Validation Result -->
        <div class="row mt-4" *ngIf="validationResult">
          <div class="col-12">
            <div class="alert" 
                 [class.alert-success]="validationResult.isValid"
                 [class.alert-danger]="!validationResult.isValid">
              <i class="fas fa-check-circle me-2" *ngIf="validationResult.isValid"></i>
              <i class="fas fa-exclamation-triangle me-2" *ngIf="!validationResult.isValid"></i>
              {{ validationResult.message }}
            </div>
          </div>
        </div>

        <!-- Range Summary -->
        <div class="row mt-4" *ngIf="validationResult && validationResult.isValid">
          <div class="col-12">
            <!-- Summary Cards Row -->
            <div class="row mb-4">
              <!-- Training Summary Card -->
              <div class="col-md-4">
                <div class="card summary-card training-card">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 class="card-title text-success mb-1">
                          <i class="fas fa-graduation-cap me-2"></i>Training
                </h5>
                        <p class="card-text text-muted small mb-2">{{ getFormattedDateRange('training') }}</p>
                        <p class="card-text text-muted small mb-0">
                          <i class="fas fa-clock me-1"></i>{{ getDateRangeDuration('training') }}
                        </p>
                      </div>
                      <div class="text-end">
                        <div class="summary-value text-success">{{ validationResult.trainingRecords | number }}</div>
                        <div class="summary-label">Records</div>
              </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Testing Summary Card -->
                  <div class="col-md-4">
                <div class="card summary-card testing-card">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 class="card-title text-warning mb-1">
                          <i class="fas fa-vial me-2"></i>Testing
                        </h5>
                        <p class="card-text text-muted small mb-2">{{ getFormattedDateRange('testing') }}</p>
                        <p class="card-text text-muted small mb-0">
                          <i class="fas fa-clock me-1"></i>{{ getDateRangeDuration('testing') }}
                        </p>
                      </div>
                      <div class="text-end">
                        <div class="summary-value text-warning">{{ validationResult.testingRecords | number }}</div>
                        <div class="summary-label">Records</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Simulation Summary Card -->
                  <div class="col-md-4">
                <div class="card summary-card simulation-card">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 class="card-title text-info mb-1">
                          <i class="fas fa-play-circle me-2"></i>Simulation
                        </h5>
                        <p class="card-text text-muted small mb-2">{{ getFormattedDateRange('simulation') }}</p>
                        <p class="card-text text-muted small mb-0">
                          <i class="fas fa-clock me-1"></i>{{ getDateRangeDuration('simulation') }}
                        </p>
                      </div>
                      <div class="text-end">
                        <div class="summary-value text-info">{{ validationResult.simulationRecords | number }}</div>
                        <div class="summary-label">Records</div>
                      </div>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>

            <!-- Timeline Chart Card -->
            <div class="card chart-card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-chart-bar me-2"></i>
                  Timeline Distribution
                </h5>
                <p class="text-muted small mb-0">Monthly data distribution across training, testing, and simulation periods</p>
              </div>
              <div class="card-body">
                  <div class="chart-container">
                  <canvas #timelineChart width="800" height="400"></canvas>
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
              Back to Upload
            </button>
            <button class="btn btn-success btn-lg" 
                    (click)="proceedToNextStep()"
                    [disabled]="!validationResult || !validationResult.isValid">
              <i class="fas fa-arrow-right me-2"></i>
              Proceed to Training
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .date-range-card {
      height: 100%;
    }
    
    .date-range-card .card-header {
      border-radius: 0.375rem 0.375rem 0 0;
    }
    
    .summary-card {
      height: 100%;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      border: none;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    
    .training-card {
      border-left: 4px solid #28a745;
    }
    
    .testing-card {
      border-left: 4px solid #ffc107;
    }
    
    .simulation-card {
      border-left: 4px solid #17a2b8;
    }
    
    .summary-value {
      font-size: 1.8rem;
      font-weight: bold;
      line-height: 1;
    }
    
    .summary-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
    }
    
    .chart-card {
      border: none;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .chart-container {
      height: 400px;
      position: relative;
      padding: 10px;
    }
    
    .card-title {
      font-weight: 600;
    }
    
    .card-text {
      margin-bottom: 0.25rem;
    }
  `]
})
export class DateRangesComponent implements OnInit, AfterViewInit {
  @ViewChild('timelineChart', { static: false }) timelineChartRef!: ElementRef<HTMLCanvasElement>;
  
  datasetMetadata: DatasetMetadata | null = null;
  dateConfig: DateRangeConfig = {
    training: { startDate: '', endDate: '' },
    testing: { startDate: '', endDate: '' },
    simulation: { startDate: '', endDate: '' }
  };
  validationResult: DateRangeValidation | null = null;
  isValidating = false;
  minDate = '';
  maxDate = '';
  private chart: Chart | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Register Chart.js components
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.datasetMetadata = this.apiService.getCurrentDatasetMetadata();
    
    if (!this.datasetMetadata) {
      this.router.navigate(['/upload']);
      return;
    }

    // Set date boundaries
    this.minDate = this.datasetMetadata.dateRange.start.split('T')[0];
    this.maxDate = this.datasetMetadata.dateRange.end.split('T')[0];

    // Load existing configuration if available
    const existingConfig = this.apiService.getCurrentDateRangeConfig();
    if (existingConfig) {
      this.dateConfig = existingConfig;
    } else {
      // Set default ranges (split dataset into thirds)
      this.setDefaultRanges();
    }
  }

  ngAfterViewInit(): void {
    // Chart will be initialized when validation result is available
  }

  private setDefaultRanges(): void {
    const startDate = new Date(this.minDate);
    const endDate = new Date(this.maxDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalDays <= 2) {
      // For very small datasets (1-2 days), use simple sequential allocation
      this.dateConfig.training.startDate = this.minDate;
      this.dateConfig.training.endDate = this.minDate;
      
      if (totalDays >= 1) {
        this.dateConfig.testing.startDate = this.maxDate;
        this.dateConfig.testing.endDate = this.maxDate;
        this.dateConfig.simulation.startDate = this.maxDate;
        this.dateConfig.simulation.endDate = this.maxDate;
      } else {
        // Single day dataset - use same day for all
        this.dateConfig.testing.startDate = this.minDate;
        this.dateConfig.testing.endDate = this.minDate;
        this.dateConfig.simulation.startDate = this.minDate;
        this.dateConfig.simulation.endDate = this.minDate;
      }
    } else {
      // For larger datasets, use thirds as before
      const thirdDays = Math.floor(totalDays / 3);
      
      // Training period (first third)
      const trainingEnd = new Date(startDate);
      trainingEnd.setDate(trainingEnd.getDate() + Math.max(0, thirdDays - 1));
      this.dateConfig.training.startDate = this.minDate;
      this.dateConfig.training.endDate = trainingEnd.toISOString().split('T')[0];

      // Testing period (second third)
      const testingStart = new Date(trainingEnd);
      testingStart.setDate(testingStart.getDate() + 1);
      const testingEnd = new Date(testingStart);
      testingEnd.setDate(testingEnd.getDate() + Math.max(0, thirdDays - 1));
      this.dateConfig.testing.startDate = testingStart.toISOString().split('T')[0];
      this.dateConfig.testing.endDate = testingEnd.toISOString().split('T')[0];

      // Simulation period (remaining)
      const simulationStart = new Date(testingEnd);
      simulationStart.setDate(simulationStart.getDate() + 1);
      this.dateConfig.simulation.startDate = simulationStart.toISOString().split('T')[0];
      this.dateConfig.simulation.endDate = this.maxDate;
    }
  }

  getMinTestingDate(): string {
    if (this.dateConfig.training.endDate) {
      const trainingEnd = new Date(this.dateConfig.training.endDate);
      trainingEnd.setDate(trainingEnd.getDate() + 1);
      return trainingEnd.toISOString().split('T')[0];
    }
    return this.minDate;
  }

  getMinSimulationDate(): string {
    if (this.dateConfig.testing.endDate) {
      const testingEnd = new Date(this.dateConfig.testing.endDate);
      testingEnd.setDate(testingEnd.getDate() + 1);
      return testingEnd.toISOString().split('T')[0];
    }
    return this.minDate;
  }

  validateRanges(): void {
    this.isValidating = true;
    this.validationResult = null;

    this.apiService.validateDateRanges(this.dateConfig).subscribe({
      next: (result) => {
        this.validationResult = result;
        this.isValidating = false;
        
        if (result.isValid) {
          this.drawTimelineChart(result.monthlyBreakdown);
        }
      },
      error: (error) => {
        this.validationResult = {
          isValid: false,
          message: error.error?.message || 'Failed to validate date ranges',
          trainingRecords: 0,
          testingRecords: 0,
          simulationRecords: 0,
          monthlyBreakdown: []
        };
        this.isValidating = false;
      }
    });
  }

  private drawTimelineChart(monthlyData: any[]): void {
    if (!monthlyData || monthlyData.length === 0) {
      return;
    }

    // Wait a bit for the DOM to be ready
    setTimeout(() => {
      if (!this.timelineChartRef?.nativeElement) {
        // Retry if canvas not ready yet
        setTimeout(() => this.drawTimelineChart(monthlyData), 100);
        return;
      }

      // Destroy existing chart if it exists
      if (this.chart) {
        this.chart.destroy();
      }

      const ctx = this.timelineChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

    // Prepare data for Chart.js
    const labels = monthlyData.map(item => item.month);
    const trainingData = monthlyData.map(item => item.training);
    const testingData = monthlyData.map(item => item.testing);
    const simulationData = monthlyData.map(item => item.simulation);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Training',
            data: trainingData,
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Testing', 
            data: testingData,
            backgroundColor: 'rgba(255, 193, 7, 0.7)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Simulation',
            data: simulationData,
            backgroundColor: 'rgba(23, 162, 184, 0.7)',
            borderColor: 'rgba(23, 162, 184, 1)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          }
        ]
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
            text: 'Monthly Data Distribution by Period',
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
                return context[0].label || '';
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y} records`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Number of Records',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
              lineWidth: 1
            },
            ticks: {
              font: {
                size: 11
              },
              callback: function(value) {
                return typeof value === 'number' ? value.toLocaleString() : value;
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

      this.chart = new Chart(ctx, config);
    }, 50);
  }

  getFormattedDateRange(period: 'training' | 'testing' | 'simulation'): string {
    const periodConfig = this.dateConfig[period];
    if (!periodConfig.startDate || !periodConfig.endDate) {
      return 'Not configured';
    }
    
    const startDate = new Date(periodConfig.startDate);
    const endDate = new Date(periodConfig.endDate);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined
    };
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-US', formatOptions);
    }
    
    return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
  }

  getDateRangeDuration(period: 'training' | 'testing' | 'simulation'): string {
    const periodConfig = this.dateConfig[period];
    if (!periodConfig.startDate || !periodConfig.endDate) {
      return '0 days';
    }
    
    const startDate = new Date(periodConfig.startDate);
    const endDate = new Date(periodConfig.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    if (diffDays === 1) {
      return '1 day';
    } else if (diffDays < 7) {
      return `${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      if (remainingDays === 0) {
        return weeks === 1 ? '1 week' : `${weeks} weeks`;
      } else {
        return `${weeks}w ${remainingDays}d`;
      }
    } else {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      if (remainingDays === 0) {
        return months === 1 ? '1 month' : `${months} months`;
      } else {
        return `${months}m ${remainingDays}d`;
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/upload']);
  }

  proceedToNextStep(): void {
    if (this.validationResult && this.validationResult.isValid) {
      this.router.navigate(['/training']);
    }
  }
}
