import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'clean', pathMatch: 'full' },
  { path: 'clean', loadComponent: () => import('./pages/clean/clean.component').then(m => m.CleanComponent) },
  { path: 'result', loadComponent: () => import('./pages/result/result.component').then(m => m.ResultComponent) },
  { path: '**', redirectTo: 'clean' }
];