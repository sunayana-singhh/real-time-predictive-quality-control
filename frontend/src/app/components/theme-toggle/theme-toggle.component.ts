import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      title="{{ themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode' }}">
      
      <!-- Sun Icon for Light Mode -->
      <div class="theme-icon sun-icon" [class.active]="themeService.isLight()">
        <i class="fas fa-sun"></i>
      </div>
      
      <!-- Moon Icon for Dark Mode -->
      <div class="theme-icon moon-icon" [class.active]="themeService.isDark()">
        <i class="fas fa-moon"></i>
      </div>
      
      <!-- Toggle Background -->
      <div class="toggle-background" [class.dark]="themeService.isDark()"></div>
    </button>
  `,
  styles: [`
    .theme-toggle {
      position: relative;
      width: 60px;
      height: 32px;
      border: none;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all var(--transition-normal);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px;
    }

    .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .toggle-background {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      transition: all var(--transition-normal);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 1;
    }

    .toggle-background.dark {
      transform: translateX(28px);
      background: var(--gray-700);
    }

    .theme-icon {
      position: relative;
      z-index: 2;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      transition: all var(--transition-normal);
      transform: scale(0.8);
      opacity: 0.6;
    }

    .theme-icon.active {
      color: var(--primary-color);
      transform: scale(1);
      opacity: 1;
    }

    .sun-icon.active {
      color: #f59e0b;
      text-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
    }

    .moon-icon.active {
      color: #6366f1;
      text-shadow: 0 0 8px rgba(99, 102, 241, 0.3);
    }

    /* Animation for icon transitions */
    .theme-icon i {
      transition: all var(--transition-normal);
    }

    .theme-toggle:hover .theme-icon.active i {
      transform: rotate(15deg) scale(1.1);
    }

    /* Focus styles for accessibility */
    .theme-toggle:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .theme-toggle {
        width: 52px;
        height: 28px;
        border-radius: 14px;
      }

      .toggle-background {
        width: 20px;
        height: 20px;
      }

      .toggle-background.dark {
        transform: translateX(24px);
      }

      .theme-icon {
        width: 20px;
        height: 20px;
        font-size: 0.7rem;
      }
    }
  `]
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
