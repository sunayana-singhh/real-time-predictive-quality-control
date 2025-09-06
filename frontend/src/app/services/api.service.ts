import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { 
  DatasetMetadata, 
  DateRangeConfig, 
  DateRangeValidation, 
  TrainingResult, 
  SimulationResult, 
  SimulationStats 
} from '../models/dataset.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';
  private datasetMetadataSubject = new BehaviorSubject<DatasetMetadata | null>(null);
  private dateRangeConfigSubject = new BehaviorSubject<DateRangeConfig | null>(null);
  private trainingResultSubject = new BehaviorSubject<TrainingResult | null>(null);

  // Public observables for components to subscribe to
  public datasetMetadata$ = this.datasetMetadataSubject.asObservable();
  public dateRangeConfig$ = this.dateRangeConfigSubject.asObservable();
  public trainingResult$ = this.trainingResultSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Upload CSV dataset and get metadata
   */
  uploadDataset(file: File): Observable<DatasetMetadata> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DatasetMetadata>(`${this.baseUrl}/dataset/upload`, formData)
      .pipe(
        tap(metadata => this.datasetMetadataSubject.next(metadata))
      );
  }

  /**
   * Validate date ranges configuration
   */
  validateDateRanges(config: DateRangeConfig): Observable<DateRangeValidation> {
    return this.http.post<DateRangeValidation>(`${this.baseUrl}/dataset/validate-ranges`, config)
      .pipe(
        tap(() => this.dateRangeConfigSubject.next(config))
      );
  }

  /**
   * Train the ML model
   */
  trainModel(config: DateRangeConfig): Observable<TrainingResult> {
    return this.http.post<TrainingResult>(`${this.baseUrl}/model/train`, config)
      .pipe(
        tap(result => this.trainingResultSubject.next(result))
      );
  }

  /**
   * Start real-time simulation
   */
  startSimulation(config: DateRangeConfig): Observable<SimulationResult[]> {
    return this.http.post<SimulationResult[]>(`${this.baseUrl}/simulation/start`, config);
  }

  /**
   * Get simulation statistics
   */
  getSimulationStats(): Observable<SimulationStats> {
    return this.http.get<SimulationStats>(`${this.baseUrl}/simulation/stats`);
  }

  /**
   * Get current dataset metadata
   */
  getCurrentDatasetMetadata(): DatasetMetadata | null {
    return this.datasetMetadataSubject.value;
  }

  /**
   * Get current date range configuration
   */
  getCurrentDateRangeConfig(): DateRangeConfig | null {
    return this.dateRangeConfigSubject.value;
  }

  /**
   * Get current training result
   */
  getCurrentTrainingResult(): TrainingResult | null {
    return this.trainingResultSubject.value;
  }

  /**
   * Clear all stored data (for reset functionality)
   */
  clearAllData(): void {
    this.datasetMetadataSubject.next(null);
    this.dateRangeConfigSubject.next(null);
    this.trainingResultSubject.next(null);
  }
}
