import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'intelliinspect-theme';
  
  // Use Angular signals for reactive state management
  private _theme = signal<ThemeMode>(this.getInitialTheme());
  
  // Public readonly signal for components to consume
  public readonly theme = this._theme.asReadonly();
  
  constructor() {
    // Effect to apply theme changes to the DOM
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this._theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set a specific theme
   */
  setTheme(theme: ThemeMode): void {
    this._theme.set(theme);
    this.saveThemeToStorage(theme);
  }

  /**
   * Check if current theme is dark
   */
  isDark(): boolean {
    return this._theme() === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLight(): boolean {
    return this._theme() === 'light';
  }

  /**
   * Get the initial theme from localStorage or system preference
   */
  private getInitialTheme(): ThemeMode {
    // First check localStorage
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Default to light theme
    return 'light';
  }

  /**
   * Apply the theme to the DOM
   */
  private applyTheme(theme: ThemeMode): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('light-theme', 'dark-theme');
      
      // Add new theme class
      root.classList.add(`${theme}-theme`);
      
      // Set data attribute for CSS targeting
      root.setAttribute('data-theme', theme);
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemeToStorage(theme: ThemeMode): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }
}
