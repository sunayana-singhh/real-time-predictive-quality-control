import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header text-center">
              <h1 class="mb-0">
                <i class="fas fa-chart-line me-2"></i>
                IntelliInspect
              </h1>
              <p class="mb-0">Real-Time Predictive Quality Control</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Progress -->
      <div class="step-progress">
        <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
          <div class="step-number">1</div>
          <span>Upload Dataset</span>
        </div>
        <div class="step" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
          <div class="step-number">2</div>
          <span>Date Ranges</span>
        </div>
        <div class="step" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
          <div class="step-number">3</div>
          <span>Model Training</span>
        </div>
        <div class="step" [class.active]="currentStep === 4" [class.completed]="currentStep > 4">
          <div class="step-number">4</div>
          <span>Simulation</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="row mb-4">
        <div class="col-12">
          <ul class="nav nav-tabs justify-content-center">
            <li class="nav-item">
              <a class="nav-link" [class.active]="currentStep === 1" routerLink="/upload">
                <i class="fas fa-upload me-1"></i>Upload Dataset
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="currentStep === 2" routerLink="/date-ranges">
                <i class="fas fa-calendar-alt me-1"></i>Date Ranges
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="currentStep === 3" routerLink="/training">
                <i class="fas fa-brain me-1"></i>Model Training
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="currentStep === 4" routerLink="/simulation">
                <i class="fas fa-play-circle me-1"></i>Simulation
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Main Content -->
      <div class="row">
        <div class="col-12">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-tabs .nav-link {
      border: none;
      color: #6c757d;
      font-weight: 500;
    }
    
    .nav-tabs .nav-link.active {
      color: #007bff;
      border-bottom: 2px solid #007bff;
    }
    
    .nav-tabs .nav-link:hover {
      color: #007bff;
    }
  `]
})
export class AppComponent {
  currentStep = 1;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentStep(event.url);
      }
    });
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
}
