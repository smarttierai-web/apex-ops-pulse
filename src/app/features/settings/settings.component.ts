import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Admin Settings & PostgreSQL Controls</h1>
          <p class="text-xs text-slate-500 mt-0.5">Supabase credentials, Row Level Security policies, and audit logs</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: Supabase & DB settings -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Connection Status Card -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <app-icon name="database" [size]="20"></app-icon>
                </div>
                <div>
                  <h3 class="font-bold text-slate-800 text-sm">Supabase Backend Engine</h3>
                  <p class="text-xs text-slate-500">PostgreSQL 15+ with Realtime replication</p>
                </div>
              </div>

              <span
                class="px-2.5 py-1 rounded-full text-xs font-semibold"
                [ngClass]="supabaseService.isLiveConnected() ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'"
              >
                {{ supabaseService.isLiveConnected() ? 'Connected & Replicating' : 'Reactive Fallback Active' }}
              </span>
            </div>

            <!-- Credentials -->
            <div class="mt-4 space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Supabase URL</label>
                <input
                  type="text"
                  [(ngModel)]="supabaseUrl"
                  placeholder="https://your-project.supabase.co"
                  class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Anon / Public API Key</label>
                <input
                  type="password"
                  [(ngModel)]="supabaseKey"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  (click)="saveCredentials()"
                  class="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <app-icon name="check" [size]="14"></app-icon>
                  <span>Save & Test Supabase Sync</span>
                </button>
              </div>
            </div>
          </div>

          <!-- RLS Policies Reference -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <h3 class="font-bold text-slate-800 text-sm mb-1">Row Level Security (RLS) Policy Table</h3>
            <p class="text-xs text-slate-500 mb-4">Active PostgreSQL row filters defined in migrations</p>

            <div class="space-y-3 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span class="font-mono font-bold text-teal-800">public.profiles</span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Employees read self; Admin & HR Manager full CRUD</p>
                </div>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold uppercase">Enforced</span>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span class="font-mono font-bold text-teal-800">public.bank_details</span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Encrypted at rest; strict auth.uid() isolation</p>
                </div>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold uppercase">Enforced</span>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span class="font-mono font-bold text-teal-800">public.attendance_logs</span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Realtime replication enabled on publication 'supabase_realtime'</p>
                </div>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold uppercase">Enforced</span>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span class="font-mono font-bold text-teal-800">public.leave_requests</span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Supervisors & HR can update status; employees can submit</p>
                </div>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold uppercase">Enforced</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Col: Role Testing -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <h3 class="font-bold text-slate-800 text-sm mb-1">Active User Role</h3>
            <p class="text-xs text-slate-500 mb-4">Toggle role identity to preview permissions</p>

            <div class="space-y-2">
              <button
                type="button"
                (click)="supabaseService.switchUserRole('hr_manager')"
                class="w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between"
                [ngClass]="supabaseService.currentUser()?.role === 'hr_manager' ? 'bg-[#1B2C4E] text-white border-[#1B2C4E]' : 'border-slate-200 hover:bg-slate-50'"
              >
                <div>
                  <div class="font-bold">HR Manager (Full Admin)</div>
                  <div class="text-[10px] opacity-80">Full workforce, payroll & approvals</div>
                </div>
                <app-icon name="check" [size]="14"></app-icon>
              </button>

              <button
                type="button"
                (click)="supabaseService.switchUserRole('supervisor')"
                class="w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between"
                [ngClass]="supabaseService.currentUser()?.role === 'supervisor' ? 'bg-[#1B2C4E] text-white border-[#1B2C4E]' : 'border-slate-200 hover:bg-slate-50'"
              >
                <div>
                  <div class="font-bold">Supervisor (Shift Lead)</div>
                  <div class="text-[10px] opacity-80">Shift check-in override, leave sign-off</div>
                </div>
                <app-icon name="check" [size]="14"></app-icon>
              </button>

              <button
                type="button"
                (click)="supabaseService.switchUserRole('operator')"
                class="w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between"
                [ngClass]="supabaseService.currentUser()?.role === 'operator' ? 'bg-[#1B2C4E] text-white border-[#1B2C4E]' : 'border-slate-200 hover:bg-slate-50'"
              >
                <div>
                  <div class="font-bold">Plant Operator</div>
                  <div class="text-[10px] opacity-80">Punch terminal, personal leave requests</div>
                </div>
                <app-icon name="check" [size]="14"></app-icon>
              </button>
            </div>
          </div>

          <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
            <span class="font-bold text-slate-800">Deployment File Reference:</span>
            <div class="font-mono text-[11px] text-teal-800 bg-white p-2 rounded-lg border border-slate-200 break-all">
              supabase/migrations/20261025000000_apex_opspulse_schema.sql
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class SettingsComponent {
  supabaseService = inject(SupabaseService);

  supabaseUrl = localStorage.getItem('apex_supabase_url') || environment.supabaseUrl;
  supabaseKey = localStorage.getItem('apex_supabase_key') || environment.supabaseKey;

  saveCredentials() {
    this.supabaseService.updateSupabaseCredentials(this.supabaseUrl, this.supabaseKey);
  }
}
