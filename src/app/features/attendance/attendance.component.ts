import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { AttendanceOverrideModalComponent } from '../modals/attendance-override-modal.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, AttendanceOverrideModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Shift Attendance & Realtime Logs</h1>
          <p class="text-xs text-slate-500 mt-0.5">Biometric, RFID gate telemetry and supervisor override audit logs</p>
        </div>

        <div class="flex items-center gap-2 self-start">
          <a
            routerLink="/biometric"
            class="px-4 py-2 bg-[#0A7380] hover:bg-[#085a64] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <app-icon name="fingerprint" [size]="14"></app-icon>
            <span>Biometric Gate Terminal</span>
          </a>

          <button
            (click)="showPunchModal = true"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <app-icon name="radio" [size]="14"></app-icon>
            <span>Manual Override</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-500">Checked-In On Floor</span>
            <div class="text-xl font-bold text-slate-800">{{ metrics().checkedInToday }} Staff</div>
          </div>
          <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <app-icon name="check-circle" [size]="18"></app-icon>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-500">Total Shift Capacity</span>
            <div class="text-xl font-bold text-slate-800">{{ metrics().totalShiftCapacity }} Posts</div>
          </div>
          <div class="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
            <app-icon name="users" [size]="18"></app-icon>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-500">Average Check-in Time</span>
            <div class="text-xl font-bold text-slate-800">{{ metrics().averageCheckInTime }}</div>
          </div>
          <div class="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <app-icon name="clock" [size]="18"></app-icon>
          </div>
        </div>
      </div>

      <!-- Filter Row -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="filterType = 'all'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            [ngClass]="filterType === 'all' ? 'bg-[#1B2C4E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            All Logs
          </button>
          <button
            type="button"
            (click)="filterType = 'check_in'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            [ngClass]="filterType === 'check_in' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Check Ins
          </button>
          <button
            type="button"
            (click)="filterType = 'check_out'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            [ngClass]="filterType === 'check_out' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Check Outs
          </button>
        </div>

        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span class="w-2 h-2 rounded-full bg-emerald-500 live-beacon"></span>
          <span>Supabase Realtime Stream: Ready</span>
        </div>
      </div>

      <!-- Attendance Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Workforce Member</th>
              <th class="py-3.5 px-4">Shift & Department</th>
              <th class="py-3.5 px-4">Verification Method</th>
              <th class="py-3.5 px-4">Timestamp</th>
              <th class="py-3.5 px-4">Notes / Gate</th>
              <th class="py-3.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (log of filteredLogs(); track log.id) {
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="log.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                      [alt]="log.user_profile?.first_name || 'Staff'"
                      class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div class="font-bold text-slate-800">{{ log.user_profile?.first_name }} {{ log.user_profile?.last_name }}</div>
                      <div class="text-[10px] font-mono text-slate-400">{{ log.user_profile?.employee_id }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <div class="text-slate-700 font-medium">{{ log.user_profile?.department }}</div>
                  <div class="text-[10px] text-slate-400">{{ log.user_profile?.shift }}</div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center gap-1 font-mono uppercase text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    <app-icon name="radio" [size]="11"></app-icon>
                    {{ log.method }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-700 font-medium font-mono">
                  {{ log.timestamp }}
                </td>
                <td class="py-3.5 px-4 text-slate-500 text-[11px]">
                  {{ log.notes || 'Line Scanner Auto-Verified' }}
                </td>
                <td class="py-3.5 px-4 text-right">
                  @if (log.type === 'check_in') {
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#DEF7EC] text-[#03543F]">
                      Checked In
                    </span>
                  } @else if (log.type === 'check_out') {
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDE8E8] text-[#9B1C1C]">
                      Checked Out
                    </span>
                  } @else {
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700">
                      Break
                    </span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (showPunchModal) {
        <app-attendance-override-modal (close)="showPunchModal = false"></app-attendance-override-modal>
      }
    </div>
  `
})
export class AttendanceComponent {
  private supabaseService = inject(SupabaseService);

  metrics = this.supabaseService.metrics;
  filterType: 'all' | 'check_in' | 'check_out' = 'all';
  showPunchModal = false;

  filteredLogs = computed(() => {
    const logs = this.supabaseService.attendanceLogs();
    if (this.filterType === 'all') return logs;
    return logs.filter(l => l.type === this.filterType);
  });
}
