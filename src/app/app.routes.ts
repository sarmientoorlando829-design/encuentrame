import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'explorar' }, // abre directo en el mapa
  { path: 'explorar', loadComponent: () => import('./pages/explore/explore.page').then((m) => m.ExplorePage) },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  { path: 'registro', loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage) },
  {
    path: 'nuevo-reporte',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/new-report/new-report.page').then((m) => m.NewReportPage),
  },
  { path: 'recuperar', loadComponent: () => import('./pages/recover/recover.page').then((m) => m.RecoverPage) },
  { path: 'restablecer', loadComponent: () => import('./pages/reset/reset.page').then((m) => m.ResetPage) },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'reporte/:id/editar',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/new-report/new-report.page').then((m) => m.NewReportPage),
  },
  {
    path: 'cambiar-contrasena',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/change-password/change-password.page').then((m) => m.ChangePasswordPage),
  },
  { path: 'reporte/:id', loadComponent: () => import('./pages/report-detail/report-detail.page').then((m) => m.ReportDetailPage) },
  { path: '**', redirectTo: 'explorar' },
];
