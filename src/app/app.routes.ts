import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CleanComponent } from './pages/clean/clean.component';
import { HistoryComponent } from './pages/history/history.component';
import { ResultComponent } from './pages/result/result.component';

export const appRoutes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'clean', component: CleanComponent, canActivate: [authGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: 'result', component: ResultComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' }
];

