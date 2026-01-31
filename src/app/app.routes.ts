import { Routes } from '@angular/router';
import { CleanComponent } from './pages/clean/clean.component';
import { ResultComponent } from './pages/result/result.component';

export const routes: Routes = [
  { path: '', component: CleanComponent },
  { path: 'result', component: ResultComponent },
  { path: '**', redirectTo: '' }
];