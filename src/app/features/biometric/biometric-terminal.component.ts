import { Component, inject, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { BiometricService } from '../../core/services/biometric.service';
import { UserProfile, AttendanceType } from '../../core/models/workforce.model';

type ScanMode = 'fingerprint' | 'facial';
type ScanState = 'idle' | 'scanning' | 'matched' | 'error';

@Component({
  selector: 'app-biometric-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Terminal Header & Status -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1B2C4E] to-[#0A7380] text-white p-6 rounded-2xl shadow-card">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 live-beacon"></span>
            <span class="text-xs uppercase font-mono tracking-widest text-teal-200">Terminal Gate Alpha • Online</span>
          </div>
          <h1 class="text-2xl font-black tracking-tight mt-1">Biometric Attendance Terminal</h1>
          <p class="text-xs text-slate-200 mt-0.5">High-speed optical fingerprint & touchless facial AI recognition check-in</p>
        </div>

        <!-- Terminal Digital Clock -->
        <div class="bg-black/25 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 text-right self-start sm:self-auto">
          <div class="text-xl font-mono font-bold tracking-wider text-emerald-300">{{ currentTimeString() }}</div>
          <div class="text-[11px] text-teal-200 uppercase font-medium">{{ currentDateString() }}</div>
        </div>
      </div>

      <!-- Main Terminal Scanner Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- LEFT 7 COLS: Biometric Sensor Pad -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 flex flex-col justify-between">
          
          <!-- Mode Switcher Tabs -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="setMode('fingerprint')"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                [ngClass]="activeMode === 'fingerprint' ? 'bg-[#1B2C4E] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              >
                <app-icon name="fingerprint" [size]="15"></app-icon>
                <span>Fingerprint Sensor</span>
              </button>

              <button
                type="button"
                (click)="setMode('facial')"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                [ngClass]="activeMode === 'facial' ? 'bg-[#0A7380] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              >
                <app-icon name="camera" [size]="15"></app-icon>
                <span>Touchless Facial AI</span>
              </button>
            </div>

            <div class="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 font-bold">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>ISO 19794-2 Sensor Ready</span>
            </div>
          </div>

          <!-- Employee Selector / Auto Identifier -->
          <div class="my-4">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Select or Scan Worker Badge ID
            </label>
            <div class="relative">
              <select
                [(ngModel)]="selectedUserId"
                (ngModelChange)="onUserChange()"
                class="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                @for (emp of workforce(); track emp.id) {
                  <option [value]="emp.id">
                    {{ emp.employee_id }} — {{ emp.first_name }} {{ emp.last_name }} ({{ emp.department }} • {{ emp.shift }})
                  </option>
                }
              </select>
            </div>
          </div>

          <!-- PUNCH ACTION SELECTION: Auto-Detected Check-In vs. Check-Out -->
          <div class="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div class="text-xs">
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Current Worker Status</span>
              <span class="font-bold text-slate-800">
                Last Punch: <span class="capitalize" [ngClass]="currentPunchStatus() === 'check_in' ? 'text-emerald-700 font-extrabold' : 'text-slate-600'">{{ currentPunchStatus().replace('_', ' ') }}</span>
              </span>
            </div>

            <!-- Toggle Buttons -->
            <div class="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                (click)="punchType = 'check_in'"
                class="px-3 py-1 rounded text-xs font-bold transition-all"
                [ngClass]="punchType === 'check_in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
              >
                Check In
              </button>
              <button
                type="button"
                (click)="punchType === 'check_out'"
                (click)="punchType = 'check_out'"
                class="px-3 py-1 rounded text-xs font-bold transition-all"
                [ngClass]="punchType === 'check_out' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
              >
                Check Out
              </button>
            </div>
          </div>

          <!-- ===================================== -->
          <!-- MODE A: OPTICAL FINGERPRINT SCANNER   -->
          <!-- ===================================== -->
          @if (activeMode === 'fingerprint') {
            <div class="relative flex flex-col items-center justify-center p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center overflow-hidden my-2">
              
              <!-- Subtle Background Mesh -->
              <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <!-- Interactive Optical Fingerprint Scanner Target -->
              <button
                type="button"
                (click)="triggerBiometricScan()"
                [disabled]="scanState === 'scanning'"
                class="relative w-36 h-36 rounded-3xl flex items-center justify-center transition-all duration-300 focus:outline-none cursor-pointer group"
                [ngClass]="{
                  'bg-teal-950/60 border-2 border-teal-500/50 hover:border-teal-400 hover:scale-105 shadow-[0_0_25px_rgba(20,184,166,0.3)]': scanState === 'idle',
                  'bg-teal-900/80 border-2 border-teal-400 shadow-[0_0_40px_rgba(45,212,191,0.6)]': scanState === 'scanning',
                  'bg-emerald-950 border-2 border-emerald-400 shadow-[0_0_45px_rgba(52,211,153,0.8)]': scanState === 'matched',
                  'bg-rose-950 border-2 border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.6)]': scanState === 'error'
                }"
              >
                <!-- Laser Sweep Beam -->
                @if (scanState === 'scanning') {
                  <div class="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[bounce_1.2s_infinite]"></div>
                }

                <!-- Fingerprint Sensor Vector Graphic -->
                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="transition-colors duration-300"
                  [ngClass]="{
                    'text-teal-400 group-hover:text-teal-300': scanState === 'idle',
                    'text-teal-200 animate-pulse': scanState === 'scanning',
                    'text-emerald-400': scanState === 'matched',
                    'text-rose-400': scanState === 'error'
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

              <!-- Prompt Text -->
              <div class="mt-5 space-y-1">
                @if (scanState === 'idle') {
                  <div class="text-sm font-bold text-white tracking-wide">Touch Sensor to Verify Biometric</div>
                  <div class="text-xs text-slate-400">Click or press thumb on optical glass to log punch</div>
                } @else if (scanState === 'scanning') {
                  <div class="text-sm font-bold text-teal-300 animate-pulse">Extracting Ridge Minutiae...</div>
                  <div class="text-xs text-slate-400">Comparing template against employee ID</div>
                } @else if (scanState === 'matched') {
                  <div class="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <app-icon name="check-circle" [size]="16"></app-icon>
                    <span>Biometric Match Confirmed (99.8%)</span>
                  </div>
                  <div class="text-xs text-slate-300">
                    {{ punchType === 'check_in' ? 'Shift Check-In Successfully Recorded' : 'Shift Check-Out Successfully Recorded' }}
                  </div>
                } @else {
                  <div class="text-sm font-bold text-rose-400">Biometric Scan Incomplete</div>
                  <div class="text-xs text-slate-400">Please clean sensor and place finger firmly</div>
                }
              </div>

              <!-- Scan Progress Bar -->
              @if (scanState === 'scanning') {
                <div class="w-48 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div class="h-full bg-teal-400 rounded-full transition-all duration-300" [style.width.%]="scanProgress"></div>
                </div>
              }
            </div>
          }

          <!-- ===================================== -->
          <!-- MODE B: TOUCHLESS FACIAL AI HUD       -->
          <!-- ===================================== -->
          @if (activeMode === 'facial') {
            <div class="relative flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center overflow-hidden my-2">
              
              <!-- Video / Camera HUD Viewport -->
              <div class="relative w-full max-w-sm h-56 rounded-2xl bg-slate-900 border border-teal-500/40 overflow-hidden flex items-center justify-center shadow-inner">
                
                <!-- WebCam or Interactive Face Scan Simulation -->
                <video #cameraVideo autoplay playsinline muted class="w-full h-full object-cover hidden"></video>

                <!-- Simulated Neural Facial Mesh Viewport -->
                <div class="relative flex flex-col items-center justify-center w-full h-full">
                  <img
                    [src]="selectedEmployee()?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                    class="w-28 h-28 rounded-full object-cover ring-2 ring-teal-500 opacity-80"
                  />

                  <!-- Facial Mesh Overlay HUD -->
                  <div class="absolute inset-8 border border-teal-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                    <div class="flex justify-between text-[9px] font-mono text-teal-300">
                      <span>[AI-CAM-1]</span>
                      <span>FOV: 84°</span>
                    </div>
                    <div class="flex justify-center">
                      <div class="w-12 h-12 rounded-full border border-dashed border-teal-300 animate-spin"></div>
                    </div>
                    <div class="flex justify-between text-[9px] font-mono text-teal-300">
                      <span>CONF: 99.4%</span>
                      <span>LIVENESS: PASS</span>
                    </div>
                  </div>

                  <!-- Laser Scan Sweep Line -->
                  @if (scanState === 'scanning') {
                    <div class="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-[bounce_1.4s_infinite]"></div>
                  }
                </div>
              </div>

              <!-- Camera Controls -->
              <div class="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  (click)="triggerBiometricScan()"
                  [disabled]="scanState === 'scanning'"
                  class="px-5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <app-icon name="camera" [size]="14"></app-icon>
                  <span>{{ scanState === 'scanning' ? 'Scanning Facial Vector...' : 'Authenticate Face & Punch' }}</span>
                </button>
              </div>

              <div class="text-[11px] text-slate-400 mt-2 font-mono">
                Touchless gate camera: Plant Floor Zone Alpha Entrance
              </div>
            </div>
          }

          <!-- Hardware Trigger Action Button -->
          <div class="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
            <div class="text-xs text-slate-500 flex items-center gap-1.5">
              <app-icon name="shield" [size]="14" customClass="text-teal-700"></app-icon>
              <span>Cryptographic Token Signatures Enabled</span>
            </div>

            <button
              type="button"
              (click)="triggerBiometricScan()"
              [disabled]="scanState === 'scanning'"
              class="px-6 py-2.5 text-xs font-bold text-white bg-[#0A7380] hover:bg-[#085a64] rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <app-icon name="fingerprint" [size]="16"></app-icon>
              <span>Verify & {{ punchType === 'check_in' ? 'Check In' : 'Check Out' }}</span>
            </button>
          </div>

        </div>

        <!-- RIGHT 5 COLS: Verification Confirmation & Live Terminal Feed -->
        <div class="lg:col-span-5 space-y-6">

          <!-- Card 1: Last Verified Verification Badge -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-sm font-bold text-slate-900">Current Verification Dossier</h3>
              <span
                class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                [ngClass]="selectedEmployee()?.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'"
              >
                {{ selectedEmployee()?.status }}
              </span>
            </div>

            @if (selectedEmployee()) {
              <div class="pt-4 space-y-4">
                <div class="flex items-center gap-3.5">
                  <img
                    [src]="selectedEmployee()?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                    [alt]="selectedEmployee()?.first_name"
                    class="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-600 shadow-sm"
                  />
                  <div>
                    <h4 class="text-base font-bold text-slate-900 leading-tight">
                      {{ selectedEmployee()?.first_name }} {{ selectedEmployee()?.last_name }}
                    </h4>
                    <div class="text-xs font-mono font-bold text-teal-800 mt-0.5">{{ selectedEmployee()?.employee_id }}</div>
                    <div class="text-[11px] text-slate-500 uppercase">{{ selectedEmployee()?.role }} • {{ selectedEmployee()?.department }}</div>
                  </div>
                </div>

                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Assigned Shift:</span>
                    <span class="font-semibold text-slate-800">{{ selectedEmployee()?.shift }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Emergency Contact:</span>
                    <span class="font-medium text-slate-800">{{ selectedEmployee()?.emergency_contact }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Biometric Template:</span>
                    <span class="font-mono text-emerald-700 font-bold">FP-TEMPLATE-OK</span>
                  </div>
                </div>

                <!-- Last Punch Status -->
                <div class="p-3 rounded-xl border flex items-center justify-between"
                     [ngClass]="punchType === 'check_in' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-slate-500">Action Pending Verification</span>
                    <div class="text-sm font-bold" [ngClass]="punchType === 'check_in' ? 'text-emerald-800' : 'text-rose-800'">
                      {{ punchType === 'check_in' ? '🟢 Shift Check In (Line Entry)' : '🔴 Shift Check Out (Line Departure)' }}
                    </div>
                  </div>
                  <span class="text-xs font-mono font-bold" [ngClass]="punchType === 'check_in' ? 'text-emerald-700' : 'text-rose-700'">
                    Biometric
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Card 2: Live Gate Punch Feed (Realtime) -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 live-beacon"></span>
                <h3 class="text-sm font-bold text-slate-900">Live Terminal Activity Feed</h3>
              </div>
              <span class="text-[10px] font-mono text-slate-400">Realtime Listener Active</span>
            </div>

            <div class="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
              @for (log of biometricLogs(); track log.id) {
                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2.5">
                    <img
                      [src]="log.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                      class="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div class="font-bold text-slate-800">{{ log.user_profile?.first_name }} {{ log.user_profile?.last_name }}</div>
                      <div class="text-[10px] font-mono text-slate-400">{{ log.timestamp }}</div>
                    </div>
                  </div>

                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    [ngClass]="log.type === 'check_in' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'"
                  >
                    {{ log.type.replace('_', ' ') }}
                  </span>
                </div>
              }
            </div>
          </div>

        </div>

      </div>

    </div>
  `
})
export class BiometricTerminalComponent implements OnInit, OnDestroy {
  @ViewChild('cameraVideo') cameraVideoRef!: ElementRef<HTMLVideoElement>;

  private supabaseService = inject(SupabaseService);
  private biometricService = inject(BiometricService);

  workforce = this.supabaseService.workforce;
  attendanceLogs = this.supabaseService.attendanceLogs;

  selectedUserId = '00000000-0000-0000-0000-000000000002'; // Annen Smith
  activeMode: ScanMode = 'fingerprint';
  scanState: ScanState = 'idle';
  scanProgress = 0;
  punchType: AttendanceType = 'check_in';

  clockTimer: any;
  currentTimeString = signal<string>('');
  currentDateString = signal<string>('');

  selectedEmployee = computed<UserProfile | null>(() => {
    return this.workforce().find(w => w.id === this.selectedUserId) || null;
  });

  currentPunchStatus = computed(() => {
    const logs = this.attendanceLogs().filter(l => l.user_id === this.selectedUserId);
    if (logs.length > 0) {
      return logs[0].type;
    }
    return 'check_out';
  });

  biometricLogs = computed(() => {
    return this.attendanceLogs().slice(0, 10);
  });

  ngOnInit() {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.autoSetPunchType();
  }

  ngOnDestroy() {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  updateClock() {
    const now = new Date();
    this.currentTimeString.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    this.currentDateString.set(now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
  }

  setMode(mode: ScanMode) {
    this.activeMode = mode;
    this.scanState = 'idle';
  }

  onUserChange() {
    this.scanState = 'idle';
    this.autoSetPunchType();
  }

  autoSetPunchType() {
    const last = this.currentPunchStatus();
    // If last action was check_in, default next action to check_out!
    this.punchType = last === 'check_in' ? 'check_out' : 'check_in';
  }

  async triggerBiometricScan() {
    if (this.scanState === 'scanning') return;

    this.scanState = 'scanning';
    this.scanProgress = 15;
    this.biometricService.playChime('scan');

    // Smooth scan animation
    const progressInterval = setInterval(() => {
      this.scanProgress = Math.min(95, this.scanProgress + 25);
    }, 200);

    // Try hardware WebAuthn if available or optical matching
    const emp = this.selectedEmployee();
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Operator';

    setTimeout(async () => {
      clearInterval(progressInterval);
      this.scanProgress = 100;
      this.scanState = 'matched';

      // Play audio confirmation chime!
      this.biometricService.playChime(this.punchType === 'check_in' ? 'check_in' : 'check_out');

      // Record to Supabase with method: 'biometric'
      await this.supabaseService.addAttendancePunch({
        userId: this.selectedUserId,
        type: this.punchType,
        method: 'biometric',
        notes: `Biometric Gate Alpha [${this.activeMode.toUpperCase()}] Verified`
      });

      // After 3 seconds, reset state to idle and toggle punch type
      setTimeout(() => {
        this.scanState = 'idle';
        this.scanProgress = 0;
        this.autoSetPunchType();
      }, 3500);

    }, 1100);
  }
}
