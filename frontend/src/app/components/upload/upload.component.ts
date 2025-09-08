import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DatasetMetadata } from '../../models/dataset.model';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-container">
      <!-- Upload Section -->
      <div class="upload-section" *ngIf="!datasetMetadata">
        <div class="upload-header">
          <div class="step-indicator">
            <div class="step-icon">
              <i class="fas fa-upload"></i>
            </div>
            <div class="step-content">
              <h2 class="step-title">Upload Dataset</h2>
              <p class="step-description">Upload your CSV dataset to begin the analysis workflow</p>
            </div>
          </div>
        </div>

        <div class="upload-card">
          <div class="upload-area" 
               [class.dragover]="isDragOver"
               [class.uploading]="isUploading"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="!isUploading && fileInput.click()">
            
            <div class="upload-visual" *ngIf="!isUploading">
              <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div class="upload-content">
                <h3 class="upload-title">Drop your CSV file here</h3>
                <p class="upload-subtitle">or click to browse and select a file</p>
                <div class="file-requirements">
                  <div class="requirement-item">
                    <i class="fas fa-check text-success me-2"></i>
                    CSV format only
                  </div>
                  <div class="requirement-item">
                    <i class="fas fa-check text-success me-2"></i>
                    Bosch Production Line Performance dataset
                  </div>
                  <div class="requirement-item">
                    <i class="fas fa-check text-success me-2"></i>
                    Maximum file size: 100MB
                  </div>
                </div>
              </div>
              <button class="btn btn-primary btn-upload" 
                      [disabled]="isUploading">
                <i class="fas fa-folder-open me-2"></i>
                Choose File
              </button>
            </div>

            <!-- Upload Progress -->
            <div class="upload-progress" *ngIf="isUploading">
              <div class="progress-icon">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <div class="progress-content">
                <h4 class="progress-title">Processing Dataset</h4>
                <p class="progress-subtitle">Analyzing and validating your data...</p>
                <div class="progress-bar-container">
                  <div class="progress-bar-modern">
                    <div class="progress-fill" [style.width.%]="uploadProgress"></div>
                  </div>
                  <span class="progress-percentage">{{ uploadProgress }}%</span>
                </div>
              </div>
            </div>
            
            <input #fileInput 
                   type="file" 
                   accept=".csv" 
                   (change)="onFileSelected($event)"
                   style="display: none;">
          </div>

          <!-- Error Message -->
          <div class="error-message" *ngIf="errorMessage">
            <div class="error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="error-content">
              <h4 class="error-title">Upload Error</h4>
              <p class="error-text">{{ errorMessage }}</p>
            </div>
            <button class="btn btn-outline-danger btn-sm" (click)="clearError()">
              <i class="fas fa-times me-1"></i>Dismiss
            </button>
          </div>
        </div>
      </div>

      <!-- Success Section -->
      <div class="success-section bounce-in" *ngIf="datasetMetadata">
        <div class="success-header">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="success-content">
            <h2 class="success-title">Dataset Successfully Uploaded!</h2>
            <p class="success-subtitle">Your data has been processed and is ready for analysis</p>
          </div>
        </div>

        <div class="dataset-summary">
          <div class="summary-grid">
            <!-- File Information Card -->
            <div class="summary-card">
              <div class="card-icon file-icon">
                <i class="fas fa-file-csv"></i>
              </div>
              <div class="card-content">
                <h3 class="card-title">File Information</h3>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">File Name:</span>
                    <span class="info-value">{{ datasetMetadata.fileName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Total Records:</span>
                    <span class="info-value highlight">{{ datasetMetadata.totalRecords | number }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Total Columns:</span>
                    <span class="info-value highlight">{{ datasetMetadata.totalColumns | number }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quality Metrics Card -->
            <div class="summary-card">
              <div class="card-icon quality-icon">
                <i class="fas fa-chart-pie"></i>
              </div>
              <div class="card-content">
                <h3 class="card-title">Quality Metrics</h3>
                <div class="quality-score">
                  <div class="score-circle" [style.--percentage]="datasetMetadata.passRate * 100">
                    <div class="score-value">{{ datasetMetadata.passRate | percent:'1.0-0' }}</div>
                    <div class="score-label">Pass Rate</div>
                  </div>
                </div>
                <div class="quality-status" 
                     [class.excellent]="datasetMetadata.passRate >= 0.9"
                     [class.good]="datasetMetadata.passRate >= 0.7 && datasetMetadata.passRate < 0.9"
                     [class.moderate]="datasetMetadata.passRate < 0.7">
                  <i class="fas fa-circle me-2"></i>
                  <span *ngIf="datasetMetadata.passRate >= 0.9">Excellent Quality</span>
                  <span *ngIf="datasetMetadata.passRate >= 0.7 && datasetMetadata.passRate < 0.9">Good Quality</span>
                  <span *ngIf="datasetMetadata.passRate < 0.7">Needs Attention</span>
                </div>
              </div>
            </div>

            <!-- Date Range Card -->
            <div class="summary-card full-width">
              <div class="card-icon time-icon">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <div class="card-content">
                <h3 class="card-title">Data Timeline</h3>
                <div class="date-range">
                  <div class="date-item">
                    <div class="date-label">Start Date</div>
                    <div class="date-value">{{ datasetMetadata.dateRange.start | date:'MMM dd, yyyy' }}</div>
                  </div>
                  <div class="date-separator">
                    <i class="fas fa-arrow-right"></i>
                  </div>
                  <div class="date-item">
                    <div class="date-label">End Date</div>
                    <div class="date-value">{{ datasetMetadata.dateRange.end | date:'MMM dd, yyyy' }}</div>
                  </div>
                </div>
                <div class="timeline-duration">
                  <i class="fas fa-clock me-2"></i>
                  {{ getDatasetDuration() }}
                </div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="action-section">
            <button class="btn btn-success btn-next" 
                    (click)="proceedToNextStep()">
              <span class="btn-content">
                <i class="fas fa-arrow-right me-2"></i>
                <span>Continue to Date Ranges</span>
              </span>
              <div class="btn-shimmer"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 800px;
      margin: 0 auto;
    }

    /* Upload Header */
    .upload-header {
      margin-bottom: var(--space-8);
    }

    .step-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-6);
      background: var(--surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow);
      transition: all var(--transition-normal);
    }

    .step-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .step-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .step-description {
      color: var(--text-secondary);
      margin: var(--space-1) 0 0 0;
      font-size: 1.1rem;
    }

    /* Upload Card */
    .upload-card {
      background: var(--surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      border: 1px solid var(--border-primary);
      transition: all var(--transition-normal);
    }

    .upload-area {
      padding: var(--space-12);
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .upload-area::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
      opacity: 0;
      transition: opacity var(--transition-normal);
    }

    .upload-area:hover::before {
      opacity: 1;
    }

    .upload-area.dragover {
      border-color: var(--primary-color);
      background: rgba(37, 99, 235, 0.05);
      transform: scale(1.02);
    }

    .upload-area.dragover::before {
      opacity: 1;
    }

    .upload-visual {
      width: 100%;
    }

    .upload-icon {
      font-size: 5rem;
      color: var(--primary-color);
      margin-bottom: var(--space-6);
      opacity: 0.8;
      transition: all var(--transition-normal);
    }

    .upload-area:hover .upload-icon {
      transform: scale(1.1);
      opacity: 1;
    }

    .upload-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }

    .upload-subtitle {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin-bottom: var(--space-6);
    }

    .file-requirements {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: var(--background-secondary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-primary);
    }

    .requirement-item {
      display: flex;
      align-items: center;
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .btn-upload {
      padding: var(--space-4) var(--space-8);
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: var(--radius-2xl);
      border: none;
      transition: all var(--transition-normal);
    }

    /* Upload Progress */
    .upload-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      width: 100%;
    }

    .progress-icon {
      font-size: 3rem;
      color: var(--primary-color);
      margin-bottom: var(--space-2);
    }

    .progress-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .progress-subtitle {
      color: var(--text-secondary);
      margin: 0;
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      max-width: 300px;
      margin-top: var(--space-4);
    }

    .progress-bar-modern {
      flex: 1;
      height: 8px;
      background: var(--background-tertiary);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
      border-radius: var(--radius);
      transition: width var(--transition-normal);
    }

    .progress-percentage {
      font-weight: 600;
      color: var(--primary-color);
      min-width: 40px;
    }

    /* Error Message */
    .error-message {
      margin: var(--space-4);
      padding: var(--space-4);
      background: var(--danger-color);
      color: white;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .error-icon {
      font-size: 1.5rem;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 var(--space-1) 0;
    }

    .error-text {
      margin: 0;
      opacity: 0.9;
    }

    /* Success Section */
    .success-section {
      text-align: center;
    }

    .success-header {
      margin-bottom: var(--space-8);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--success-color), #059669);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2.5rem;
      box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
    }

    .success-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      text-shadow: 0 1px 2px var(--shadow-color);
    }

    /* Enhanced dark mode visibility for success text */
    [data-theme="dark"] .success-title {
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    [data-theme="dark"] .success-subtitle {
      color: #e2e8f0;
    }

    /* Enhanced dark mode visibility for all important text */
    [data-theme="dark"] .card-title {
      color: #ffffff;
    }

    [data-theme="dark"] .info-value {
      color: #ffffff;
    }

    [data-theme="dark"] .date-value {
      color: #ffffff;
    }

    [data-theme="dark"] .step-title {
      color: #ffffff;
    }

    .success-subtitle {
      color: var(--text-secondary);
      font-size: 1.1rem;
      margin: 0;
    }

    /* Dataset Summary */
    .dataset-summary {
      background: var(--surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-lg);
      padding: var(--space-8);
      border: 1px solid var(--border-primary);
      transition: all var(--transition-normal);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .summary-card {
      padding: var(--space-6);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      background: var(--surface);
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .summary-card.full-width {
      grid-column: 1 / -1;
    }

    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      margin-bottom: var(--space-4);
    }

    .file-icon {
      background: linear-gradient(135deg, var(--info-color), #0891b2);
      color: white;
    }

    .quality-icon {
      background: linear-gradient(135deg, var(--success-color), #059669);
      color: white;
    }

    .time-icon {
      background: linear-gradient(135deg, var(--warning-color), #d97706);
      color: white;
    }

    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-4) 0;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .info-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .info-value.highlight {
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    /* Quality Score Circle */
    .quality-score {
      display: flex;
      justify-content: center;
      margin-bottom: var(--space-4);
    }

    .score-circle {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(var(--success-color) calc(var(--percentage) * 1%), var(--gray-200) 0);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .score-circle::before {
      content: '';
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      background: var(--surface);
    }

    .score-value,
    .score-label {
      position: relative;
      z-index: 1;
    }

    .score-value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--success-color);
      line-height: 1;
    }

    .score-label {
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .quality-status {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 600;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius);
    }

    .quality-status.excellent {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success-color);
    }

    .quality-status.good {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning-color);
    }

    .quality-status.moderate {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger-color);
    }

    /* Date Range */
    .date-range {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .date-item {
      text-align: center;
    }

    .date-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-1);
    }

    .date-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .date-separator {
      color: var(--text-tertiary);
      font-size: 1.2rem;
    }

    .timeline-duration {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
      padding: var(--space-2) var(--space-4);
      background: var(--background-secondary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-primary);
    }

    /* Action Button */
    .action-section {
      text-align: center;
    }

    .btn-next {
      position: relative;
      padding: var(--space-4) var(--space-8);
      font-size: 1.2rem;
      font-weight: 600;
      border-radius: var(--radius-2xl);
      border: none;
      overflow: hidden;
      transition: all var(--transition-normal);
      box-shadow: var(--shadow-lg);
    }

    .btn-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
    }

    .btn-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }

    .btn-next:hover .btn-shimmer {
      transform: translateX(100%);
    }

    .btn-next:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-xl);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .upload-container {
        padding: 0 var(--space-4);
      }

      .step-indicator {
        flex-direction: column;
        text-align: center;
        gap: var(--space-3);
      }

      .upload-area {
        padding: var(--space-8);
        min-height: 300px;
      }

      .upload-icon {
        font-size: 4rem;
      }

      .upload-title {
        font-size: 1.3rem;
      }

      .file-requirements {
        align-items: center;
      }

      .summary-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .dataset-summary {
        padding: var(--space-6);
      }

      .success-title {
        font-size: 1.6rem;
      }

      .success-icon {
        width: 60px;
        height: 60px;
        font-size: 2rem;
      }
    }

    @media (max-width: 480px) {
      .upload-area {
        padding: var(--space-6);
      }

      .upload-icon {
        font-size: 3rem;
      }

      .upload-title {
        font-size: 1.2rem;
      }

      .btn-upload,
      .btn-next {
        width: 100%;
      }

      .date-range {
        flex-direction: column;
        gap: var(--space-2);
      }

      .date-separator {
        transform: rotate(90deg);
      }
    }
  `]
})
export class UploadComponent implements OnInit {
  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  datasetMetadata: DatasetMetadata | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if dataset is already uploaded
    this.datasetMetadata = this.apiService.getCurrentDatasetMetadata();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.errorMessage = 'Please select a CSV file.';
      return;
    }

    this.errorMessage = '';
    this.isUploading = true;
    this.uploadProgress = 0;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 10;
      }
    }, 200);

    this.apiService.uploadDataset(file).subscribe({
      next: (metadata) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.datasetMetadata = metadata;
        this.isUploading = false;
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.errorMessage = error.error?.message || 'Failed to upload dataset. Please try again.';
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  proceedToNextStep(): void {
    this.router.navigate(['/date-ranges']);
  }

  clearError(): void {
    this.errorMessage = '';
  }

  getDatasetDuration(): string {
    if (!this.datasetMetadata?.dateRange) {
      return 'Unknown duration';
    }

    const startDate = new Date(this.datasetMetadata.dateRange.start);
    const endDate = new Date(this.datasetMetadata.dateRange.end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '1 day';
    } else if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      if (remainingDays === 0) {
        return months === 1 ? '1 month' : `${months} months`;
      } else {
        return `${months}m ${remainingDays}d`;
      }
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const months = Math.floor(remainingDays / 30);
      if (months === 0) {
        return years === 1 ? '1 year' : `${years} years`;
      } else {
        return `${years}y ${months}m`;
      }
    }
  }
}
