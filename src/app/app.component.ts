import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { IconComponent } from './shared/components/icon.component';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { SupabaseService } from './core/services/supabase.service';
import { SettingsModalComponent } from './features/modals/settings-modal.component';
import { BiometricModalComponent } from './features/modals/biometric-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    IconComponent,
    ToastContainerComponent,
    SettingsModalComponent,
    BiometricModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  supabaseService = inject(SupabaseService);

  currentUser = this.supabaseService.currentUser;
  metrics = this.supabaseService.metrics;

  showUserMenu = signal<boolean>(false);
  showSettingsModal = signal<boolean>(false);
  showBiometricModal = signal<boolean>(false);
  mobileSidebarOpen = signal<boolean>(false);

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }
}
