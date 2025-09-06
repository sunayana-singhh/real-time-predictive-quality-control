import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DateRangeConfig, SimulationResult, SimulationStats } from '../../models/dataset.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-12">
        <!-- Header -->
        <div class="card">
          <div class="card-header">
            <h4 class="mb-0">
              <i class="fas fa-play-circle me-2"></i>
              Step 4: Real-Time Prediction Simulation
            </h4>
          </div>
          <div class="card-body">
            <p class="text-muted">
              Simulate real-time quality predictions on historical data with live streaming updates.
            </p>
          </div>
        </div>

        <!-- Simulation Controls -->
        <div class="card">
          <div class="card-body text-center">
            <div class="simulation-controls">
              <button class="btn btn-success btn-lg btn-simulation" 
                      (click)="startSimulation()"
                      [disabled]="isSimulating || isCompleted"
                      *ngIf="!isCompleted">
                <i class="fas fa-play me-2" *ngIf="!isSimulating"></i>
                <i class="fas fa-spinner fa-spin me-2" *ngIf="isSimulating"></i>
                {{ isSimulating ? 'Simulation Running...' : 'Start Simulation' }}
              </button>
              
              <button class="btn btn-primary btn-lg btn-simulation" 
                      (click)="restartSimulation()"
                      *ngIf="isCompleted">
                <i class="fas fa-redo me-2"></i>
                Restart Simulation
              </button>
            </div>

            <!-- Simulation Status -->
            <div class="mt-3" *ngIf="isCompleted">
              <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Simulation completed successfully!</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Panel -->
        <div class="row mt-4" *ngIf="simulationStats">
          <div class="col-md-3">
            <div class="card metrics-card">
              <div class="card-body text-center">
                <div class="metrics-value text-primary">{{ simulationStats.totalPredictions | number }}</div>
                <div class="metrics-label">Total Predictions</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card metrics-card">
              <div class="card-body text-center">
                <div class="metrics-value text-success">{{ simulationStats.passCount | number }}</div>
                <div class="metrics-label">Pass Count</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card metrics-card">
              <div class="card-body text-center">
                <div class="metrics-value text-danger">{{ simulationStats.failCount | number }}</div>
                <div class="metrics-label">Fail Count</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card metrics-card">
              <div class="card-body text-center">
                <div class="metrics-value text-info">{{ simulationStats.averageConfidence | percent:'1.1-1' }}</div>
                <div class="metrics-label">Avg Confidence</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="row mt-4" *ngIf="simulationResults.length > 0">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-chart-line me-2"></i>
                  Real-Time Quality Predictions
                </h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas #qualityChart></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-chart-pie me-2"></i>
                  Prediction Confidence Distribution
                </h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas #confidenceChart></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Prediction Stream Table -->
        <div class="card mt-4" *ngIf="simulationResults.length > 0">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-table me-2"></i>
              Live Prediction Stream
            </h5>
          </div>
          <div class="card-body">
            <div class="live-table">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>Time</th>
                    <th>Sample ID</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Temperature (°C)</th>
                    <th>Pressure (hPa)</th>
                    <th>Humidity (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let result of simulationResults.slice(-50)" 
                      [class.table-success]="result.prediction === 'Pass'"
                      [class.table-danger]="result.prediction === 'Fail'">
                    <td>{{ result.timestamp | date:'HH:mm:ss' }}</td>
                    <td>{{ result.sampleId }}</td>
                    <td>
                      <span class="badge" 
                            [class.bg-success]="result.prediction === 'Pass'"
                            [class.bg-danger]="result.prediction === 'Fail'">
                        {{ result.prediction }}
                      </span>
                    </td>
                    <td>{{ result.confidence | percent:'1.1-1' }}</td>
                    <td>{{ result.temperature | number:'1.1-1' }}</td>
                    <td>{{ result.pressure | number:'1.0-0' }}</td>
                    <td>{{ result.humidity | number:'1.1-1' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="row mt-4">
          <div class="col-12 text-center">
            <button class="btn btn-secondary me-3" 
                    (click)="goBack()">
              <i class="fas fa-arrow-left me-2"></i>
              Back to Training
            </button>
            <button class="btn btn-info" 
                    (click)="exportResults()"
                    [disabled]="simulationResults.length === 0">
              <i class="fas fa-download me-2"></i>
              Export Results
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .simulation-controls {
      padding: 20px;
    }
    
    .btn-simulation {
      min-width: 200px;
    }
    
    .metrics-card {
      border-left: 4px solid #007bff;
    }
    
    .metrics-card:nth-child(2) {
      border-left-color: #28a745;
    }
    
    .metrics-card:nth-child(3) {
      border-left-color: #dc3545;
    }
    
    .metrics-card:nth-child(4) {
      border-left-color: #17a2b8;
    }
    
    .chart-container {
      height: 300px;
      position: relative;
    }
    
    .live-table {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .table th {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .table-success {
      background-color: rgba(40, 167, 69, 0.1) !important;
    }
    
    .table-danger {
      background-color: rgba(220, 53, 69, 0.1) !important;
    }
  `]
})
export class SimulationComponent implements OnInit, OnDestroy {
  simulationResults: SimulationResult[] = [];
  simulationStats: SimulationStats | null = null;
  isSimulating = false;
  isCompleted = false;
  private simulationSubscription: Subscription | null = null;
  private updateInterval: Subscription | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if we have the required configuration and training result
    const dateConfig = this.apiService.getCurrentDateRangeConfig();
    const trainingResult = this.apiService.getCurrentTrainingResult();
    
    if (!dateConfig || !trainingResult) {
      this.router.navigate(['/training']);
      return;
    }
  }

  ngOnDestroy(): void {
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
    }
  }

  startSimulation(): void {
    const dateConfig = this.apiService.getCurrentDateRangeConfig();
    if (!dateConfig) {
      return;
    }

    this.isSimulating = true;
    this.isCompleted = false;
    this.simulationResults = [];
    this.simulationStats = null;

    // Start the simulation
    this.simulationSubscription = this.apiService.startSimulation(dateConfig).subscribe({
      next: (results) => {
        this.simulationResults = results;
        this.isSimulating = false;
        this.isCompleted = true;
        
        // Get final statistics
        this.apiService.getSimulationStats().subscribe({
          next: (stats) => {
            this.simulationStats = stats;
            this.drawCharts();
          }
        });
      },
      error: (error) => {
        console.error('Simulation error:', error);
        this.isSimulating = false;
      }
    });

    // Simulate real-time updates (for demo purposes)
    this.simulateRealTimeUpdates();
  }

  private simulateRealTimeUpdates(): void {
    // This simulates real-time streaming by adding results progressively
    const mockResults: SimulationResult[] = [];
    const startTime = new Date();
    
    this.updateInterval = interval(1000).subscribe(() => {
      if (this.isSimulating && mockResults.length < 100) {
        const result: SimulationResult = {
          timestamp: new Date(startTime.getTime() + mockResults.length * 1000).toISOString(),
          sampleId: `SAMPLE_${String(mockResults.length + 1).padStart(4, '0')}`,
          prediction: Math.random() > 0.3 ? 'Pass' : 'Fail',
          confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
          temperature: Math.random() * 20 + 20, // 20-40°C
          pressure: Math.random() * 200 + 900, // 900-1100 hPa
          humidity: Math.random() * 40 + 30 // 30-70%
        };
        
        mockResults.push(result);
        this.simulationResults = [...mockResults];
        this.updateStats();
        this.drawCharts();
      } else if (mockResults.length >= 100) {
        this.isSimulating = false;
        this.isCompleted = true;
        this.updateInterval?.unsubscribe();
      }
    });
  }

  private updateStats(): void {
    if (this.simulationResults.length === 0) return;

    const passCount = this.simulationResults.filter(r => r.prediction === 'Pass').length;
    const failCount = this.simulationResults.length - passCount;
    const avgConfidence = this.simulationResults.reduce((sum, r) => sum + r.confidence, 0) / this.simulationResults.length;

    this.simulationStats = {
      totalPredictions: this.simulationResults.length,
      passCount,
      failCount,
      averageConfidence: avgConfidence
    };
  }

  private drawCharts(): void {
    // This would integrate with Chart.js for real-time visualization
    // For now, we'll just log the data
    console.log('Drawing charts with data:', {
      results: this.simulationResults.length,
      stats: this.simulationStats
    });
  }

  restartSimulation(): void {
    this.simulationResults = [];
    this.simulationStats = null;
    this.isCompleted = false;
    this.startSimulation();
  }

  exportResults(): void {
    if (this.simulationResults.length === 0) return;

    const csvContent = this.convertToCSV(this.simulationResults);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(results: SimulationResult[]): string {
    const headers = ['Timestamp', 'Sample ID', 'Prediction', 'Confidence', 'Temperature', 'Pressure', 'Humidity'];
    const rows = results.map(r => [
      r.timestamp,
      r.sampleId,
      r.prediction,
      r.confidence,
      r.temperature,
      r.pressure,
      r.humidity
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  goBack(): void {
    this.router.navigate(['/training']);
  }
}
