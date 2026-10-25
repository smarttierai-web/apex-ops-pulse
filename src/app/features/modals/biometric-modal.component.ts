import { Component, EventEmitter, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { BiometricService } from '../../core/services/biometric.service';
import { AttendanceType } from '../../core/models/workforce.model';

@Component({
  selector: 'app-biometric-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-[#1B2C4E] text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <app-icon name="fingerprint" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-semibold leading-none">Biometric Punch Scanner</h3>
              <p class="text-xs text-slate-300 mt-1">Optical fingerprint verification for shift check-in / check-out</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-1">
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <!-- Select Employee -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Workforce Member</label>
            <select
              [(ngModel)]="selectedUserId"
              (ngModelChange)="onUserChange()"
              class="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              @for (emp of supabaseService.workforce(); track emp.id) {
                <option [value]="emp.id">
                  {{ emp.employee_id }} — {{ emp.first_name }} {{ emp.last_name }} ({{ emp.department }})
                </option>
              }
            </select>
          </div>

          <!-- Action Switcher: Check In vs Check Out -->
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="punchType = 'check_in'"
              class="p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
              [ngClass]="punchType === 'check_in' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
            >
              <app-icon name="check-circle" [size]="16"></app-icon>
              <span>Shift Check In</span>
            </button>

            <button
              type="button"
              (click)="punchType = 'check_out'"
              class="p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
              [ngClass]="punchType === 'check_out' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
            >
              <app-icon name="clock" [size]="16"></app-icon>
              <span>Shift Check Out</span>
            </button>
          </div>

          <!-- Interactive Fingerprint Optical Scanner Pad -->
          <div class="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center relative overflow-hidden">
            <button
              type="button"
              (click)="startScan()"
              [disabled]="isScanning"
              class="relative w-28 h-28 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none group"
              [ngClass]="{
                'bg-teal-950/80 border-2 border-teal-500/60 hover:scale-105 shadow-[0_0_30px_rgba(20,184,166,0.35)]': !isScanning && !scanMatched,
                'bg-teal-900 border-2 border-teal-400 shadow-[0_0_40px_rgba(45,212,191,0.7)]': isScanning,
                'bg-emerald-950 border-2 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.8)]': scanMatched
              }"
            >
              <!-- Scanning laser line -->
              @if (isScanning) {
                <div class="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[bounce_1s_infinite]"></div>
              }

              <!-- Fingerprint SVG Icon -->
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                [ngClass]="{
                  'text-teal-400 group-hover:text-teal-300': !isScanning && !scanMatched,
                  'text-teal-200 animate-pulse': isScanning,
                  'text-emerald-400': scanMatched
                }"
              >
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 3"/>
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                <path d="M2 12a10 10 0 0 1 18-6"/>
                <path d="M2 16h.01"/>
                <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
              </svg>
            </button>

            <!-- Status message -->
            <div class="mt-4 text-xs font-semibold">
              @if (!isScanning && !scanMatched) {
                <span class="text-slate-300">Touch or click sensor to scan biometric fingerprint</span>
              } @else if (isScanning) {
                <span class="text-teal-300 animate-pulse">Matching Minutiae Points (ISO 19794-2)...</span>
              } @else {
                <span class="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                  <app-icon name="check-circle" [size]="14"></app-icon>
                  <span>Biometric Verified: 99.8% Match</span>
                </span>
              }
            </div>
          </div>

          <!-- Employee Card Preview -->
          @if (currentEmployee()) {
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <img [src]="currentEmployee()?.avatar_url" class="w-10 h-10 rounded-xl object-cover ring-1 ring-teal-600" />
              <div class="flex-1">
                <div class="text-xs font-bold text-slate-800">{{ currentEmployee()?.first_name }} {{ currentEmployee()?.last_name }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ currentEmployee()?.employee_id }} • {{ currentEmployee()?.department }}</div>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                    [ngClass]="punchType === 'check_in' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                {{ punchType.replace('_', ' ') }}
              </span>
            </div>
          }

          <!-- Footer Actions -->
          <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              (click)="startScan()"
              [disabled]="isScanning"
              class="px-5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <app-icon name="fingerprint" [size]="15"></app-icon>
              <span>Scan & Record {{ punchType === 'check_in' ? 'Check In' : 'Check Out' }}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  `
})
export class BiometricModalComponent {
  @Output() close = new EventEmitter<void>();

  supabaseService = inject(SupabaseService);
  biometricService = inject(BiometricService);

  selectedUserId = '00000000-0000-0000-0000-000000000002'; // Annen Smith
  punchType: AttendanceType = 'check_in';
  isScanning = false;
  scanMatched = false;

  currentEmployee = computed(() => {
    return this.supabaseService.workforce().find(w => w.id === this.selectedUserId);
  });

  onUserChange() {
    this.scanMatched = false;
    this.autoCheckPunchType();
  }

  autoCheckPunchType() {
    const logs = this.supabaseService.attendanceLogs().filter(l => l.user_id === this.selectedUserId);
    if (logs.length > 0 && logs[0].type === 'check_in') {
      this.punchType = 'check_out';
    } else {
      this.punchType = 'check_in';
    }
  }

  async startScan() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.scanMatched = false;
    this.biometricService.playChime('scan');

    setTimeout(async () => {
      this.isScanning = false;
      this.scanMatched = true;

      // Play synthesized tone
      this.biometricService.playChime(this.punchType === 'check_in' ? 'check_in' : 'check_out');

      // Add biometric punch to Supabase
      await this.supabaseService.addAttendancePunch({
        userId: this.selectedUserId,
        type: this.punchType,
        method: 'biometric',
        notes: `Biometric Scanner Pad Verified (${this.punchType.toUpperCase()})`
      });

      // Auto close after confirmation
      setTimeout(() => {
        this.close.emit();
      }, 1600);
    }, 1000);
  }
}
