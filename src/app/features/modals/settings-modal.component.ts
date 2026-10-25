import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 bg-[#1B2C4E] text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <app-icon name="settings" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-semibold leading-none">Apex Admin Settings & Supabase Config</h3>
              <p class="text-xs text-slate-300 mt-1">PostgreSQL connection, RLS security policies & Realtime status</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-1">
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-5">
          <!-- Connection Status Card -->
          <div class="p-4 rounded-xl border flex items-center justify-between"
               [ngClass]="supabaseService.isLiveConnected() ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-800'">
            <div class="flex items-center gap-3">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      [ngClass]="supabaseService.isLiveConnected() ? 'bg-emerald-400' : 'bg-teal-400'"></span>
                <span class="relative inline-flex rounded-full h-3 w-3"
                      [ngClass]="supabaseService.isLiveConnected() ? 'bg-emerald-500' : 'bg-teal-600'"></span>
              </span>
              <div>
                <div class="text-xs font-bold uppercase tracking-wider">Engine State</div>
                <div class="text-sm font-semibold">{{ supabaseService.connectionStatusText() }}</div>
              </div>
            </div>

            <div class="text-xs px-2.5 py-1 rounded-full font-medium"
                 [ngClass]="supabaseService.isLiveConnected() ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700'">
              {{ supabaseService.isLiveConnected() ? 'PostgreSQL Active' : 'Reactive Fallback Active' }}
            </div>
          </div>

          <!-- Supabase Credentials Form -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Supabase API Credentials</h4>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Project URL (supabaseUrl)</label>
              <input
                type="text"
                [(ngModel)]="supabaseUrl"
                placeholder="https://your-project.supabase.co"
                class="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Anon / Public API Key (supabaseKey)</label>
              <input
                type="password"
                [(ngModel)]="supabaseKey"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                class="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
              />
            </div>
          </div>

          <!-- Role Switching for Demo & RBAC test -->
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">RBAC Role Switcher (Preview Test)</h4>
            <p class="text-xs text-slate-500">Switch current session role to test different UI permissions and RLS simulation:</p>
            <div class="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                (click)="supabaseService.switchUserRole('hr_manager')"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                [ngClass]="supabaseService.currentUser()?.role === 'hr_manager' ? 'bg-[#1B2C4E] text-white border-[#1B2C4E]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'"
              >
                HR Manager (Full Admin)
              </button>
              <button
                type="button"
                (click)="supabaseService.switchUserRole('supervisor')"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                [ngClass]="supabaseService.currentUser()?.role === 'supervisor' ? 'bg-[#1B2C4E] text-white border-[#1B2C4E]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'"
              >
                Supervisor (Shift Lead)
              </button>
              <button
                type="button"
                (click)="supabaseService.switchUserRole('operator')"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                [ngClass]="supabaseService.currentUser()?.role === 'operator' ? 'bg-[#1B2C4E] text-white border-[#1B2C4E]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'"
              >
                Operator (Worker)
              </button>
            </div>
          </div>

          <!-- Migration Script Location Info -->
          <div class="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center justify-between">
            <div class="flex items-center gap-2">
              <app-icon name="database" [size]="16" customClass="text-teal-700"></app-icon>
              <span>SQL migration script located at: <code class="font-mono font-bold">supabase/migrations/...</code></span>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              (click)="saveCredentials()"
              class="px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <app-icon name="check" [size]="14"></app-icon>
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsModalComponent {
  @Output() close = new EventEmitter<void>();

  supabaseService = inject(SupabaseService);

  supabaseUrl = localStorage.getItem('apex_supabase_url') || environment.supabaseUrl;
  supabaseKey = localStorage.getItem('apex_supabase_key') || environment.supabaseKey;

  saveCredentials() {
    this.supabaseService.updateSupabaseCredentials(this.supabaseUrl, this.supabaseKey);
    this.close.emit();
  }
}
