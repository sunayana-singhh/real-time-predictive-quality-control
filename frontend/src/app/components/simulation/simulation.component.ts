import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DateRangeConfig, SimulationResult, SimulationStats } from '../../models/dataset.model';
import { interval, Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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

        <!-- Live Statistics Panel -->
        <div class="row mt-4" *ngIf="simulationStats">
          <div class="col-md-3">
            <div class="card metrics-card animated-card">
              <div class="card-body text-center">
                <div class="metrics-icon">
                  <i class="fas fa-chart-bar text-primary"></i>
                </div>
                <div class="metrics-value text-primary" 
                     [attr.data-value]="simulationStats.totalPredictions">
                  {{ simulationStats.totalPredictions | number }}
                </div>
                <div class="metrics-label">Total Predictions</div>
                <div class="metrics-trend" *ngIf="isSimulating">
                  <i class="fas fa-arrow-up text-success"></i>
                  <small class="text-muted">Live</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card metrics-card animated-card">
              <div class="card-body text-center">
                <div class="metrics-icon">
                  <i class="fas fa-check-circle text-success"></i>
                </div>
                <div class="metrics-value text-success" 
                     [attr.data-value]="simulationStats.passCount">
                  {{ simulationStats.passCount | number }}
                </div>
                <div class="metrics-label">Pass Count</div>
                <div class="metrics-trend">
                  <small class="text-muted">
                    {{ getPassRate() | percent:'1.0-0' }} Pass Rate
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card metrics-card animated-card">
              <div class="card-body text-center">
                <div class="metrics-icon">
                  <i class="fas fa-times-circle text-danger"></i>
                </div>
                <div class="metrics-value text-danger" 
                     [attr.data-value]="simulationStats.failCount">
                  {{ simulationStats.failCount | number }}
                </div>
                <div class="metrics-label">Fail Count</div>
                <div class="metrics-trend">
                  <small class="text-muted">
                    {{ getFailRate() | percent:'1.0-0' }} Fail Rate
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card metrics-card animated-card">
              <div class="card-body text-center">
                <div class="metrics-icon">
                  <i class="fas fa-percentage text-info"></i>
                </div>
                <div class="metrics-value text-info" 
                     [attr.data-value]="simulationStats.averageConfidence">
                  {{ simulationStats.averageConfidence | percent:'1.1-1' }}
                </div>
                <div class="metrics-label">Avg Confidence</div>
                <div class="metrics-trend">
                  <small class="text-muted confidence-indicator"
                         [class.text-success]="simulationStats.averageConfidence >= 0.8"
                         [class.text-warning]="simulationStats.averageConfidence >= 0.6 && simulationStats.averageConfidence < 0.8"
                         [class.text-danger]="simulationStats.averageConfidence < 0.6">
                    {{ getConfidenceLevel() }}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="row mt-4" *ngIf="simulationResults.length > 0">
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-chart-line me-2"></i>
                  Real-Time Quality Predictions
                </h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas #realtimeChart width="400" height="300"></canvas>
                </div>
                <div class="chart-status mt-2" *ngIf="isSimulating">
                  <small class="text-muted">
                    <i class="fas fa-circle text-success blink"></i>
                    Updating in real-time
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-chart-area me-2"></i>
                  Live Confidence Tracking
                </h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas #confidenceTrackingChart width="400" height="300"></canvas>
                </div>
                <div class="confidence-indicators mt-2">
                  <div class="row text-center">
                    <div class="col-4">
                      <small class="confidence-zone high">
                        <span class="zone-color bg-success"></span>
                        High (80%+)
                      </small>
                    </div>
                    <div class="col-4">
                      <small class="confidence-zone medium">
                        <span class="zone-color bg-warning"></span>
                        Medium (60-80%)
                      </small>
                    </div>
                    <div class="col-4">
                      <small class="confidence-zone low">
                        <span class="zone-color bg-danger"></span>
                        Low (<60%)
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-chart-pie me-2"></i>
                  Prediction Distribution
                </h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas #confidenceChart width="400" height="300"></canvas>
                </div>
                <div class="distribution-legend mt-2">
                  <div class="row text-center">
                    <div class="col-6">
                      <span class="legend-item">
                        <span class="legend-color bg-success"></span>
                        Pass: {{ getPassRate() | percent:'1.0-0' }}
                      </span>
                    </div>
                    <div class="col-6">
                      <span class="legend-item">
                        <span class="legend-color bg-danger"></span>
                        Fail: {{ getFailRate() | percent:'1.0-0' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Prediction Stream Table -->
        <div class="card mt-4" *ngIf="simulationResults.length > 0">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-table me-2"></i>
              Live Prediction Stream
              <span class="badge bg-primary ms-2">{{ simulationResults.length }} records</span>
            </h5>
            <div class="stream-status" *ngIf="isSimulating">
              <span class="badge bg-success">
                <i class="fas fa-broadcast-tower me-1"></i>
                Live Streaming
              </span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="live-table">
              <table class="table table-striped table-hover mb-0">
                <thead class="table-dark sticky-top">
                  <tr>
                    <th width="12%">
                      <i class="fas fa-clock me-1"></i>
                      Time
                    </th>
                    <th width="15%">
                      <i class="fas fa-barcode me-1"></i>
                      Sample ID
                    </th>
                    <th width="12%">
                      <i class="fas fa-check-circle me-1"></i>
                      Prediction
                    </th>
                    <th width="13%">
                      <i class="fas fa-percentage me-1"></i>
                      Confidence
                    </th>
                    <th width="16%">
                      <i class="fas fa-thermometer-half me-1"></i>
                      Temperature (°C)
                    </th>
                    <th width="16%">
                      <i class="fas fa-tachometer-alt me-1"></i>
                      Pressure (hPa)
                    </th>
                    <th width="16%">
                      <i class="fas fa-tint me-1"></i>
                      Humidity (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let result of getLatestResults(); let i = index;" 
                      [class.table-success]="result.prediction === 'Pass'"
                      [class.table-danger]="result.prediction === 'Fail'"
                      [class.new-row]="i < 3 && isSimulating"
                      [attr.data-timestamp]="result.timestamp">
                    <td class="text-monospace">
                      <small>{{ result.timestamp | date:'HH:mm:ss.SSS' }}</small>
                    </td>
                    <td class="fw-bold">{{ result.sampleId }}</td>
                    <td>
                      <span class="badge prediction-badge" 
                            [class.bg-success]="result.prediction === 'Pass'"
                            [class.bg-danger]="result.prediction === 'Fail'">
                        <i class="fas" 
                           [class.fa-check]="result.prediction === 'Pass'"
                           [class.fa-times]="result.prediction === 'Fail'"></i>
                        {{ result.prediction }}
                      </span>
                    </td>
                    <td>
                      <div class="confidence-cell">
                        <span class="confidence-value"
                              [class.text-success]="result.confidence >= 0.8"
                              [class.text-warning]="result.confidence >= 0.6 && result.confidence < 0.8"
                              [class.text-danger]="result.confidence < 0.6">
                          {{ result.confidence | percent:'1.1-1' }}
                        </span>
                        <div class="confidence-bar">
                          <div class="confidence-fill"
                               [style.width.%]="result.confidence * 100"
                               [class.bg-success]="result.confidence >= 0.8"
                               [class.bg-warning]="result.confidence >= 0.6 && result.confidence < 0.8"
                               [class.bg-danger]="result.confidence < 0.6">
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span [class.text-danger]="result.temperature > 35"
                            [class.text-warning]="result.temperature > 30 && result.temperature <= 35"
                            [class.text-success]="result.temperature <= 30">
                        {{ result.temperature | number:'1.1-1' }}°
                      </span>
                    </td>
                    <td>
                      <span [class.text-danger]="result.pressure > 1050"
                            [class.text-warning]="result.pressure > 1000 && result.pressure <= 1050"
                            [class.text-success]="result.pressure <= 1000">
                        {{ result.pressure | number:'1.0-0' }}
                      </span>
                    </td>
                    <td>
                      <span [class.text-danger]="result.humidity > 60"
                            [class.text-warning]="result.humidity > 50 && result.humidity <= 60"
                            [class.text-success]="result.humidity <= 50">
                        {{ result.humidity | number:'1.1-1' }}%
                      </span>
                    </td>
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
    
    /* Enhanced Metrics Cards */
    .animated-card {
      transition: all 0.3s ease;
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .animated-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #007bff, #0056b3);
    }
    
    .animated-card:nth-child(2)::before {
      background: linear-gradient(90deg, #28a745, #1e7e34);
    }
    
    .animated-card:nth-child(3)::before {
      background: linear-gradient(90deg, #dc3545, #c82333);
    }
    
    .animated-card:nth-child(4)::before {
      background: linear-gradient(90deg, #17a2b8, #138496);
    }
    
    .animated-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    .metrics-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .metrics-value {
      font-size: 2.5rem;
      font-weight: bold;
      line-height: 1;
      margin: 0.5rem 0;
      transition: transform 0.3s ease;
    }
    
    .metrics-label {
      font-size: 0.9rem;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #6c757d;
    }
    
    .metrics-trend {
      margin-top: 0.5rem;
      font-size: 0.8rem;
    }
    
    /* Chart Enhancements */
    .chart-container {
      height: 350px;
      position: relative;
      padding: 10px;
    }
    
    .chart-status {
      text-align: center;
    }
    
    .blink {
      animation: blink 1s infinite;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }
    
    .distribution-legend {
      border-top: 1px solid #dee2e6;
      padding-top: 10px;
    }
    
    .legend-item {
      display: inline-flex;
      align-items: center;
      font-size: 0.9rem;
    }
    
    .legend-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    /* Enhanced Live Table */
    .live-table {
      max-height: 500px;
      overflow-y: auto;
      border-radius: 0 0 8px 8px;
    }
    
    .live-table::-webkit-scrollbar {
      width: 8px;
    }
    
    .live-table::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    .live-table::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    .live-table::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    .table th {
      position: sticky;
      top: 0;
      z-index: 10;
      font-size: 0.85rem;
      font-weight: 600;
      border-bottom: 2px solid #495057;
    }
    
    .table td {
      font-size: 0.9rem;
      vertical-align: middle;
      border-color: rgba(0, 0, 0, 0.05);
    }
    
    .new-row {
      animation: slideInFromRight 0.5s ease-out, highlightNewRow 2s ease-out;
    }
    
    @keyframes slideInFromRight {
      0% {
        transform: translateX(100%);
        opacity: 0;
      }
      100% {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes highlightNewRow {
      0% { background-color: rgba(255, 193, 7, 0.3); }
      100% { background-color: transparent; }
    }
    
    .prediction-badge {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      min-width: 60px;
    }
    
    .confidence-cell {
      position: relative;
    }
    
    .confidence-value {
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    .confidence-bar {
      width: 100%;
      height: 4px;
      background-color: #e9ecef;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }
    
    .confidence-fill {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 2px;
    }
    
    .table-success {
      background-color: rgba(40, 167, 69, 0.08) !important;
    }
    
    .table-danger {
      background-color: rgba(220, 53, 69, 0.08) !important;
    }
    
    .table-success:hover {
      background-color: rgba(40, 167, 69, 0.15) !important;
    }
    
    .table-danger:hover {
      background-color: rgba(220, 53, 69, 0.15) !important;
    }
    
    /* Stream Status */
    .stream-status .badge {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    /* Confidence Level Colors */
    .confidence-indicator.text-success::before {
      content: '🟢 ';
    }
    
    .confidence-indicator.text-warning::before {
      content: '🟡 ';
    }
    
    .confidence-indicator.text-danger::before {
      content: '🔴 ';
    }
    
    /* Confidence Zone Indicators */
    .confidence-indicators {
      border-top: 1px solid #dee2e6;
      padding-top: 8px;
    }
    
    .confidence-zone {
      display: inline-flex;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    .zone-color {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }
    
    .confidence-zone.high {
      color: #155724;
    }
    
    .confidence-zone.medium {
      color: #856404;
    }
    
    .confidence-zone.low {
      color: #721c24;
    }
  `]
})
export class SimulationComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('realtimeChart', { static: false }) realtimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confidenceChart', { static: false }) confidenceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confidenceTrackingChart', { static: false }) confidenceTrackingChartRef!: ElementRef<HTMLCanvasElement>;

  simulationResults: SimulationResult[] = [];
  simulationStats: SimulationStats | null = null;
  isSimulating = false;
  isCompleted = false;
  private simulationSubscription: Subscription | null = null;
  private updateInterval: Subscription | null = null;
  
  private realtimeChart: Chart | null = null;
  private confidenceChart: Chart | null = null;
  private confidenceTrackingChart: Chart | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // Check if we have the required configuration and training result
    const dateConfig = this.apiService.getCurrentDateRangeConfig();
    const trainingResult = this.apiService.getCurrentTrainingResult();
    
    if (!dateConfig || !trainingResult) {
      this.router.navigate(['/training']);
      return;
    }
  }

  ngAfterViewInit(): void {
    // Charts will be initialized when simulation starts
  }

  ngOnDestroy(): void {
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
    }
    if (this.realtimeChart) {
      this.realtimeChart.destroy();
    }
    if (this.confidenceChart) {
      this.confidenceChart.destroy();
    }
    if (this.confidenceTrackingChart) {
      this.confidenceTrackingChart.destroy();
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

    // Start real-time simulation (demo mode)
    this.simulateRealTimeUpdates();
  }

  private simulateRealTimeUpdates(): void {
    // This simulates real-time streaming by adding results progressively
    const mockResults: SimulationResult[] = [];
    const startTime = new Date();
    
    this.updateInterval = interval(1000).subscribe(() => {
      if (this.isSimulating && mockResults.length < 100) {
        // Generate more realistic simulation data
        const temperature = Math.random() * 20 + 20; // 20-40°C
        const pressure = Math.random() * 200 + 900; // 900-1100 hPa
        const humidity = Math.random() * 40 + 30; // 30-70%
        
        // Base quality on sensor parameters for realism
        let qualityScore = 0.5;
        if (temperature <= 30) qualityScore += 0.2;
        if (pressure <= 1000) qualityScore += 0.2;
        if (humidity <= 50) qualityScore += 0.1;
        
        const isPass = Math.random() < qualityScore;
        const confidence = isPass ? 
          Math.random() * 0.3 + 0.7 : // Pass: 70-100% confidence
          Math.random() * 0.3 + 0.5;  // Fail: 50-80% confidence

        const result: SimulationResult = {
          timestamp: new Date(startTime.getTime() + mockResults.length * 1000).toISOString(),
          sampleId: `SAMPLE_${String(mockResults.length + 1).padStart(4, '0')}`,
          prediction: isPass ? 'Pass' : 'Fail',
          confidence: confidence,
          temperature: temperature,
          pressure: pressure,
          humidity: humidity
        };
        
        mockResults.push(result);
        this.simulationResults = [...mockResults];
        this.updateStats();
        this.updateCharts();
      } else if (mockResults.length >= 100) {
        this.isSimulating = false;
        this.isCompleted = true;
        this.updateInterval?.unsubscribe();
        
        // Final update of charts and statistics
        this.updateStats();
        this.updateCharts();
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

  private updateCharts(): void {
    this.drawRealtimeChart();
    this.drawConfidenceChart();
    this.drawConfidenceTrackingChart();
  }

  private drawRealtimeChart(): void {
    if (!this.simulationResults.length || !this.realtimeChartRef?.nativeElement) {
      return;
    }

    setTimeout(() => {
      if (!this.realtimeChartRef?.nativeElement) return;

      const ctx = this.realtimeChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      // Prepare data for the last 50 points for better performance
      const recentResults = this.simulationResults.slice(-50);
      const labels = recentResults.map((_, index) => `T+${index + 1}`);
      const confidenceData = recentResults.map(r => r.confidence * 100);
      const predictionData = recentResults.map(r => r.prediction === 'Pass' ? 100 : 0);

      const config: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Prediction Confidence (%)',
            data: confidenceData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 6,
            borderWidth: 2
          }, {
            label: 'Pass/Fail Status',
            data: predictionData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: false,
            tension: 0,
            pointRadius: 3,
            pointHoverRadius: 8,
            borderWidth: 3,
            stepped: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            title: {
              display: true,
              text: 'Real-Time Quality Predictions',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              callbacks: {
                afterLabel: (context) => {
                  const index = context.dataIndex;
                  const result = recentResults[index];
                  return [
                    `Sample: ${result.sampleId}`,
                    `Temp: ${result.temperature.toFixed(1)}°C`,
                    `Pressure: ${result.pressure.toFixed(0)} hPa`,
                    `Humidity: ${result.humidity.toFixed(1)}%`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Time Sequence'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Percentage (%)'
              },
              min: 0,
              max: 100,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          animation: {
            duration: this.isSimulating ? 300 : 1000,
            easing: 'easeOutQuart'
          }
        }
      };

      if (this.realtimeChart) {
        this.realtimeChart.destroy();
      }

      this.realtimeChart = new Chart(ctx, config);
    }, 10);
  }

  private drawConfidenceChart(): void {
    if (!this.simulationStats || !this.confidenceChartRef?.nativeElement) {
      return;
    }

    setTimeout(() => {
      if (!this.confidenceChartRef?.nativeElement) return;

      const ctx = this.confidenceChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      const passCount = this.simulationStats!.passCount;
      const failCount = this.simulationStats!.failCount;

      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels: ['Pass', 'Fail'],
          datasets: [{
            data: [passCount, failCount],
            backgroundColor: [
              'rgba(40, 167, 69, 0.8)',
              'rgba(220, 53, 69, 0.8)'
            ],
            borderColor: [
              'rgba(40, 167, 69, 1)',
              'rgba(220, 53, 69, 1)'
            ],
            borderWidth: 3,
            hoverBorderWidth: 5,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            arc: {
              borderWidth: 3
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Prediction Distribution',
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: 20
            },
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i] as number;
                      const total = passCount + failCount;
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                      const backgroundColor = data.datasets[0].backgroundColor as string[];
                      const borderColor = data.datasets[0].borderColor as string[];
                      return {
                        text: `${label}: ${value} (${percentage}%)`,
                        fillStyle: backgroundColor?.[i] || '#000',
                        strokeStyle: borderColor?.[i] || '#000',
                        lineWidth: 2,
                        pointStyle: 'circle' as const,
                        index: i
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
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = passCount + failCount;
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return `${label}: ${value} predictions (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      };

      if (this.confidenceChart) {
        this.confidenceChart.destroy();
      }

      this.confidenceChart = new Chart(ctx, config);
    }, 10);
  }

  private drawConfidenceTrackingChart(): void {
    if (!this.simulationResults.length || !this.confidenceTrackingChartRef?.nativeElement) {
      return;
    }

    setTimeout(() => {
      if (!this.confidenceTrackingChartRef?.nativeElement) return;

      const ctx = this.confidenceTrackingChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      // Prepare data for the last 30 points for better visualization
      const recentResults = this.simulationResults.slice(-30);
      const labels = recentResults.map((_, index) => `T+${index + 1}`);
      const confidenceData = recentResults.map(r => r.confidence * 100);
      
      // Create background colors based on confidence levels
      const backgroundColors = confidenceData.map(confidence => {
        if (confidence >= 80) return 'rgba(40, 167, 69, 0.2)'; // High - Green
        if (confidence >= 60) return 'rgba(255, 193, 7, 0.2)'; // Medium - Yellow
        return 'rgba(220, 53, 69, 0.2)'; // Low - Red
      });

      const borderColors = confidenceData.map(confidence => {
        if (confidence >= 80) return 'rgba(40, 167, 69, 1)'; // High - Green
        if (confidence >= 60) return 'rgba(255, 193, 7, 1)'; // Medium - Yellow
        return 'rgba(220, 53, 69, 1)'; // Low - Red
      });

      const config: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Confidence Level (%)',
            data: confidenceData,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 8,
            borderWidth: 3,
            pointBackgroundColor: borderColors,
            pointBorderColor: borderColors,
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            title: {
              display: true,
              text: 'Real-Time Confidence Tracking',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              callbacks: {
                afterLabel: (context) => {
                  const index = context.dataIndex;
                  const result = recentResults[index];
                  const confidence = result.confidence * 100;
                  let level = 'Low';
                  if (confidence >= 80) level = 'High';
                  else if (confidence >= 60) level = 'Medium';
                  
                  return [
                    `Confidence Level: ${level}`,
                    `Sample: ${result.sampleId}`,
                    `Prediction: ${result.prediction}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Time Sequence',
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                font: {
                  size: 10
                }
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Confidence (%)',
                font: {
                  size: 11
                }
              },
              min: 0,
              max: 100,
              grid: {
                color: (context) => {
                  // Add horizontal lines for confidence zones
                  if (context.tick.value === 80) return 'rgba(40, 167, 69, 0.5)'; // High threshold
                  if (context.tick.value === 60) return 'rgba(255, 193, 7, 0.5)'; // Medium threshold
                  return 'rgba(0, 0, 0, 0.1)';
                }
              },
              ticks: {
                font: {
                  size: 10
                },
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          animation: {
            duration: this.isSimulating ? 200 : 800,
            easing: 'easeOutQuart'
          }
        }
      };

      if (this.confidenceTrackingChart) {
        this.confidenceTrackingChart.destroy();
      }

      this.confidenceTrackingChart = new Chart(ctx, config);
    }, 10);
  }

  restartSimulation(): void {
    // Stop any running simulation
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
      this.updateInterval = null;
    }
    
    // Reset all data
    this.simulationResults = [];
    this.simulationStats = null;
    this.isCompleted = false;
    this.isSimulating = false;
    
    // Destroy existing charts
    if (this.realtimeChart) {
      this.realtimeChart.destroy();
      this.realtimeChart = null;
    }
    if (this.confidenceChart) {
      this.confidenceChart.destroy();
      this.confidenceChart = null;
    }
    if (this.confidenceTrackingChart) {
      this.confidenceTrackingChart.destroy();
      this.confidenceTrackingChart = null;
    }
    
    // Start fresh simulation
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

  // Helper methods for enhanced UI
  getLatestResults(): SimulationResult[] {
    return this.simulationResults.slice(-50).reverse();
  }

  getPassRate(): number {
    if (!this.simulationStats || this.simulationStats.totalPredictions === 0) {
      return 0;
    }
    return this.simulationStats.passCount / this.simulationStats.totalPredictions;
  }

  getFailRate(): number {
    if (!this.simulationStats || this.simulationStats.totalPredictions === 0) {
      return 0;
    }
    return this.simulationStats.failCount / this.simulationStats.totalPredictions;
  }

  getConfidenceLevel(): string {
    if (!this.simulationStats) return 'Unknown';
    
    const confidence = this.simulationStats.averageConfidence;
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  }
}
