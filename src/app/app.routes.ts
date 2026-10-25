import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard | Apex OpsPulse'
  },
  {
    path: 'directory',
    loadComponent: () => import('./features/directory/directory.component').then(m => m.DirectoryComponent),
    title: 'Workforce Directory | Apex OpsPulse'
  },
  {
    path: 'attendance',
    loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent),
    title: 'Daily Attendance | Apex OpsPulse'
  },
  {
    path: 'leaves',
    loadComponent: () => import('./features/leaves/leaves.component').then(m => m.LeavesComponent),
    title: 'Leave Approvals | Apex OpsPulse'
  },
  {
    path: 'payroll',
    loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent),
    title: 'Payroll & Compensation | Apex OpsPulse'
  },
  {
    path: 'performance',
    loadComponent: () => import('./features/performance/performance.component').then(m => m.PerformanceComponent),
    title: 'Performance & Reviews | Apex OpsPulse'
  },
  {
    path: 'policies',
    loadComponent: () => import('./features/policies/policies.component').then(m => m.PoliciesComponent),
    title: 'Compliance & SOPs | Apex OpsPulse'
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    title: 'Admin Settings | Apex OpsPulse'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
