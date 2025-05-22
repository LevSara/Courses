import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';  // וודא שפקודת ייבוא זו נכונה
import { provideHttpClient } from '@angular/common/http';

// קונפיגורציית אפליקציה
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),  // לאבחון אוטומטי של שינויים
    provideRouter(routes),  // מספק את הנתיבים ל-Router
    provideHttpClient(),  // ספק HTTP לקביעת חיבורי רשת
  ],
};
