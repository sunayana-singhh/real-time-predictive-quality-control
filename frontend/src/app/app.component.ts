import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  template: `
    <div class="app-container">
      <!-- Modern Header -->
      <header class="app-header">
        <div class="header-content">
          <div class="brand-section">
            <div class="brand-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="brand-text">
              <h1 class="brand-title">IntelliInspect</h1>
              <p class="brand-subtitle">Real-Time Predictive Quality Control</p>
            </div>
          </div>
          <div class="header-actions">
            <app-theme-toggle></app-theme-toggle>
            <button class="btn btn-outline-light btn-sm" (click)="resetWorkflow()">
              <i class="fas fa-refresh me-2"></i>Reset
            </button>
          </div>
        </div>
      </header>

      <!-- Modern Step Progress -->
      <div class="workflow-progress">
        <div class="step-progress">
          <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
            <div class="step-number">
              <span *ngIf="currentStep === 1 || currentStep < 1">1</span>
            </div>
            <span>Upload Dataset</span>
          </div>
          <div class="step" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
            <div class="step-number">
              <span *ngIf="currentStep === 2 || currentStep < 2">2</span>
            </div>
            <span>Date Ranges</span>
          </div>
          <div class="step" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
            <div class="step-number">
              <span *ngIf="currentStep === 3 || currentStep < 3">3</span>
            </div>
            <span>Model Training</span>
          </div>
          <div class="step" [class.active]="currentStep === 4" [class.completed]="currentStep > 4">
            <div class="step-number">
              <span *ngIf="currentStep === 4 || currentStep < 4">4</span>
            </div>
            <span>Simulation</span>
          </div>
        </div>
      </div>

      <!-- Modern Navigation -->
      <nav class="workflow-navigation">
        <div class="nav-container">
          <a class="nav-item" 
             [class.active]="currentStep === 1" 
             [class.disabled]="false"
             routerLink="/upload">
            <div class="nav-icon">
              <i class="fas fa-upload"></i>
            </div>
            <div class="nav-content">
              <span class="nav-title">Upload</span>
              <span class="nav-subtitle">Dataset</span>
            </div>
          </a>
          <a class="nav-item" 
             [class.active]="currentStep === 2" 
             [class.disabled]="currentStep < 1"
             routerLink="/date-ranges">
            <div class="nav-icon">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="nav-content">
              <span class="nav-title">Configure</span>
              <span class="nav-subtitle">Date Ranges</span>
            </div>
          </a>
          <a class="nav-item" 
             [class.active]="currentStep === 3" 
             [class.disabled]="currentStep < 2"
             routerLink="/training">
            <div class="nav-icon">
              <i class="fas fa-brain"></i>
            </div>
            <div class="nav-content">
              <span class="nav-title">Train</span>
              <span class="nav-subtitle">Model</span>
            </div>
          </a>
          <a class="nav-item" 
             [class.active]="currentStep === 4" 
             [class.disabled]="currentStep < 3"
             routerLink="/simulation">
            <div class="nav-icon">
              <i class="fas fa-play-circle"></i>
            </div>
            <div class="nav-content">
              <span class="nav-title">Run</span>
              <span class="nav-subtitle">Simulation</span>
            </div>
          </a>
        </div>
      </nav>

      <!-- Main Content Area -->
      <main class="main-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-primary) 100%);
      transition: background var(--transition-normal);
    }

    /* Modern Header */
    .app-header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      padding: var(--space-6) 0;
      box-shadow: var(--shadow-lg);
      position: relative;
      overflow: hidden;
    }

    .app-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
      pointer-events: none;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--space-6);
      position: relative;
      z-index: 1;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .brand-icon {
      width: 60px;
      height: 60px;
      background: rgba(255,255,255,0.2);
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
    }

    .brand-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .brand-subtitle {
      font-size: 1.1rem;
      margin: 0;
      opacity: 0.9;
      font-weight: 400;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .header-actions .btn {
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
      transition: all var(--transition-normal);
    }

    .header-actions .btn:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }

    /* Workflow Progress */
    .workflow-progress {
      background: var(--surface);
      border-bottom: 1px solid var(--border-primary);
      padding: var(--space-4) 0;
      transition: all var(--transition-normal);
    }

    /* Modern Navigation */
    .workflow-navigation {
      background: var(--surface);
      border-bottom: 1px solid var(--border-primary);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
      transition: all var(--transition-normal);
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      padding: 0 var(--space-6);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-4);
      text-decoration: none;
      color: var(--text-secondary);
      transition: all var(--transition-normal);
      border-bottom: 3px solid transparent;
      position: relative;
      overflow: hidden;
    }

    .nav-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      opacity: 0;
      transition: opacity var(--transition-normal);
    }

    .nav-item:hover::before {
      opacity: 0.05;
    }

    .nav-item.active::before {
      opacity: 0.1;
    }

    .nav-item.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%);
    }

    .nav-item.disabled {
      color: var(--text-tertiary);
      pointer-events: none;
      opacity: 0.6;
    }

    .nav-icon {
      width: 40px;
      height: 40px;
      background: var(--background-tertiary);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all var(--transition-normal);
      position: relative;
      z-index: 1;
    }

    .nav-item.active .nav-icon {
      background: var(--primary-color);
      color: white;
      transform: scale(1.1);
    }

    .nav-content {
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }

    .nav-title {
      font-weight: 600;
      font-size: 1rem;
      line-height: 1.2;
    }

    .nav-subtitle {
      font-size: 0.85rem;
      opacity: 0.7;
      font-weight: 400;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      padding: var(--space-8) 0;
    }

    .content-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .header-content,
      .nav-container,
      .content-wrapper {
        padding: 0 var(--space-4);
      }
    }

    @media (max-width: 768px) {
      .brand-title {
        font-size: 2rem;
      }

      .brand-subtitle {
        font-size: 1rem;
      }

      .brand-icon {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
      }

      .nav-container {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-2);
      }

      .nav-item {
        padding: var(--space-4) var(--space-3);
        flex-direction: column;
        text-align: center;
        gap: var(--space-2);
      }

      .nav-icon {
        width: 36px;
        height: 36px;
        font-size: 1.1rem;
      }

      .nav-content {
        align-items: center;
      }

      .nav-title {
        font-size: 0.9rem;
      }

      .nav-subtitle {
        font-size: 0.8rem;
      }
    }

    @media (max-width: 480px) {
      .header-content {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .nav-container {
        grid-template-columns: 1fr;
        padding: 0 var(--space-2);
      }

      .main-content {
        padding: var(--space-4) 0;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  currentStep = 1;
  private themeService = inject(ThemeService);

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentStep(event.url);
      }
    });
  }

  ngOnInit(): void {
    // Theme service will auto-initialize with saved preference or system preference
  }

  private updateCurrentStep(url: string): void {
    if (url.includes('/upload')) {
      this.currentStep = 1;
    } else if (url.includes('/date-ranges')) {
      this.currentStep = 2;
    } else if (url.includes('/training')) {
      this.currentStep = 3;
    } else if (url.includes('/simulation')) {
      this.currentStep = 4;
    }
  }

  resetWorkflow(): void {
    // Reset to step 1 and navigate to upload
    this.currentStep = 1;
    this.router.navigate(['/upload']);
    
    // Here you could also clear any stored data if needed
    // this.apiService.clearAllData();
  }
}
