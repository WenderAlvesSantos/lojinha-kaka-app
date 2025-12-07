import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { inject as injectAnalytics } from '@vercel/analytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private platformId = inject(PLATFORM_ID);
  private initialized = false;

  constructor() {
    if (isPlatformBrowser(this.platformId) && !this.initialized) {
      this.initAnalytics();
      this.initialized = true;
    }
  }

  private initAnalytics(): void {
    try {
      // Inicializar Analytics da Vercel
      injectAnalytics({
        framework: 'angular'
      });
    } catch (error) {
      console.warn('Vercel Analytics não pôde ser inicializado:', error);
    }
  }
}

