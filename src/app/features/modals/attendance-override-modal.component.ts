import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { AttendanceType, PunchMethod } from '../../core/models/workforce.model';

@Component({
  selector: 'app-attendance-override-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div class="px-6 py-4 bg-[#1B2C4E] text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <app-icon name="clock" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-semibold leading-none">Attendance Log & Realtime Punch</h3>
              <p class="text-xs text-slate-300 mt-1">Manual punch override and Supabase Realtime testing</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-1">
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Select Workforce Member</label>
            <select
              [(ngModel)]="selectedUserId"
              class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              @for (emp of supabaseService.workforce(); track emp.id) {
                <option [value]="emp.id">
                  {{ emp.first_name }} {{ emp.last_name }} ({{ emp.employee_id }}) - {{ emp.department }}
                </option>
              }
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Punch Event</label>
              <select
                [(ngModel)]="punchType"
                class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                <option value="check_in">🟢 Check In (Shift Start)</option>
                <option value="check_out">🔴 Check Out (Shift End)</option>
                <option value="break">🟡 Break Log</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Verification Method</label>
              <select
                [(ngModel)]="method"
                class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                <option value="rfid_scan">RFID Badge Terminal</option>
                <option value="biometric">Biometric Palm/Fingerprint</option>
                <option value="manual">Manual Supervisor Override</option>
                <option value="qr">Dynamic QR Scanner</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Shift Station / Gate Notes</label>
            <input
              type="text"
              [(ngModel)]="notes"
              placeholder="e.g. Main Plant Gate 2 - Assembly Shift Handover"
              class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div class="font-semibold text-slate-700 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 live-beacon"></span>
              <span>Supabase Realtime Replication Active</span>
            </div>
            <p>Submitting this punch will append directly to the Real-Time Activity Log feed and update dashboard metrics immediately.</p>
          </div>

          <div class="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="recordPunch()"
              class="px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <app-icon name="check-circle" [size]="14"></app-icon>
              <span>Record Punch Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceOverrideModalComponent {
  @Output() close = new EventEmitter<void>();

  supabaseService = inject(SupabaseService);

  selectedUserId = '00000000-0000-0000-0000-000000000002';
  punchType: AttendanceType = 'check_in';
  method: PunchMethod = 'rfid_scan';
  notes = 'Plant Gate Alpha - Shift Check-in';

  async recordPunch() {
    await this.supabaseService.addAttendancePunch({
      userId: this.selectedUserId,
      type: this.punchType,
      method: this.method,
      notes: this.notes
    });
    this.close.emit();
  }
}
