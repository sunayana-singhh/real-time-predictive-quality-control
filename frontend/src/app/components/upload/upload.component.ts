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
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- Upload Card -->
        <div class="card" *ngIf="!datasetMetadata">
          <div class="card-header">
            <h4 class="mb-0">
              <i class="fas fa-upload me-2"></i>
              Step 1: Upload Dataset
            </h4>
          </div>
          <div class="card-body">
            <div class="upload-area" 
                 [class.dragover]="isDragOver"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 (click)="fileInput.click()">
              
              <div class="upload-icon">
                <i class="fas fa-file-csv"></i>
              </div>
              
              <h5>Click to select a CSV file or drag and drop</h5>
              <p class="text-muted">Upload the Kaggle Bosch Production Line Performance dataset</p>
              
              <input #fileInput 
                     type="file" 
                     accept=".csv" 
                     (change)="onFileSelected($event)"
                     style="display: none;">
              
              <button class="btn btn-primary btn-lg mt-3" 
                      [disabled]="isUploading">
                <i class="fas fa-folder-open me-2"></i>
                Choose File
              </button>
            </div>

            <!-- Upload Progress -->
            <div class="mt-3" *ngIf="isUploading">
              <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     [style.width.%]="uploadProgress">
                  {{ uploadProgress }}%
                </div>
              </div>
              <p class="text-center mt-2">
                <i class="fas fa-spinner fa-spin me-2"></i>
                Processing dataset...
              </p>
            </div>

            <!-- Error Message -->
            <div class="alert alert-danger mt-3" *ngIf="errorMessage">
              <i class="fas fa-exclamation-triangle me-2"></i>
              {{ errorMessage }}
            </div>
          </div>
        </div>

        <!-- Dataset Summary Card -->
        <div class="card fade-in" *ngIf="datasetMetadata">
          <div class="card-header">
            <h4 class="mb-0">
              <i class="fas fa-check-circle me-2"></i>
              Dataset Uploaded Successfully
            </h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h6><i class="fas fa-file me-2"></i>File Information</h6>
                <p><strong>File Name:</strong> {{ datasetMetadata.fileName }}</p>
                <p><strong>Total Records:</strong> {{ datasetMetadata.totalRecords | number }}</p>
                <p><strong>Total Columns:</strong> {{ datasetMetadata.totalColumns }}</p>
              </div>
              <div class="col-md-6">
                <h6><i class="fas fa-chart-pie me-2"></i>Quality Metrics</h6>
                <p><strong>Pass Rate:</strong> 
                  <span class="badge bg-success">{{ datasetMetadata.passRate | percent:'1.1-1' }}</span>
                </p>
                <p><strong>Date Range:</strong></p>
                <p class="text-muted">
                  {{ datasetMetadata.dateRange.start | date:'medium' }}<br>
                  to {{ datasetMetadata.dateRange.end | date:'medium' }}
                </p>
              </div>
            </div>

            <!-- Next Button -->
            <div class="text-center mt-4">
              <button class="btn btn-success btn-lg" 
                      (click)="proceedToNextStep()">
                <i class="fas fa-arrow-right me-2"></i>
                Proceed to Date Ranges
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-area {
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .upload-area:hover {
      transform: translateY(-2px);
    }
    
    .progress {
      height: 25px;
    }
    
    .progress-bar {
      font-size: 0.9rem;
      font-weight: bold;
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
}
