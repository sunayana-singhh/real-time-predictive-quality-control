import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DatasetMetadata, DateRangeConfig, DateRangeValidation } from '../../models/dataset.model';

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
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-chart-bar me-2"></i>
                  Date Range Summary
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4">
                    <div class="metrics-card">
                      <div class="metrics-value text-success">{{ validationResult.trainingRecords | number }}</div>
                      <div class="metrics-label">Training Records</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="metrics-card">
                      <div class="metrics-value text-warning">{{ validationResult.testingRecords | number }}</div>
                      <div class="metrics-label">Testing Records</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="metrics-card">
                      <div class="metrics-value text-info">{{ validationResult.simulationRecords | number }}</div>
                      <div class="metrics-label">Simulation Records</div>
                    </div>
                  </div>
                </div>

                <!-- Timeline Chart -->
                <div class="mt-4">
                  <h6>Monthly Data Distribution</h6>
                  <div class="chart-container">
                    <canvas #timelineChart></canvas>
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
    
    .metrics-card {
      text-align: center;
      padding: 20px;
      border-radius: 10px;
      background-color: #f8f9fa;
    }
    
    .chart-container {
      height: 200px;
      position: relative;
    }
  `]
})
export class DateRangesComponent implements OnInit {
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

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

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

  private setDefaultRanges(): void {
    const startDate = new Date(this.minDate);
    const endDate = new Date(this.maxDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const thirdDays = Math.floor(totalDays / 3);

    // Training period (first third)
    const trainingEnd = new Date(startDate);
    trainingEnd.setDate(trainingEnd.getDate() + thirdDays);
    this.dateConfig.training.startDate = this.minDate;
    this.dateConfig.training.endDate = trainingEnd.toISOString().split('T')[0];

    // Testing period (second third)
    const testingStart = new Date(trainingEnd);
    testingStart.setDate(testingStart.getDate() + 1);
    const testingEnd = new Date(testingStart);
    testingEnd.setDate(testingEnd.getDate() + thirdDays);
    this.dateConfig.testing.startDate = testingStart.toISOString().split('T')[0];
    this.dateConfig.testing.endDate = testingEnd.toISOString().split('T')[0];

    // Simulation period (remaining)
    const simulationStart = new Date(testingEnd);
    simulationStart.setDate(simulationStart.getDate() + 1);
    this.dateConfig.simulation.startDate = simulationStart.toISOString().split('T')[0];
    this.dateConfig.simulation.endDate = this.maxDate;
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
    // This would integrate with Chart.js for visualization
    // For now, we'll just log the data
    console.log('Monthly breakdown:', monthlyData);
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
