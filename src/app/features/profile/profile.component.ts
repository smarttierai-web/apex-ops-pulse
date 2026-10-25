import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { UserProfile, AttendanceLog, LeaveRequest } from '../../core/models/workforce.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Top Banner / Privacy Alert -->
      <div class="p-3.5 bg-gradient-to-r from-teal-900 to-[#1B2C4E] rounded-2xl text-white shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <app-icon name="shield" [size]="16"></app-icon>
          </div>
          <div>
            <div class="font-bold flex items-center gap-2">
              <span>Confidential Individual Dossier</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30 uppercase font-mono">
                PostgreSQL RLS Protected
              </span>
            </div>
            <p class="text-teal-100/80 text-[11px] mt-0.5">
              Personal, operational, and financial records are isolated per individual. Sensitive bank and contact ledgers are restricted by policy.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            (click)="selectMyProfile()"
            class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
            title="Switch to your own individual record"
          >
            <app-icon name="user" [size]="13"></app-icon>
            <span>My Own Record</span>
          </button>

          <button
            type="button"
            (click)="printDossier()"
            class="px-3 py-1.5 rounded-xl bg-teal-600/60 hover:bg-teal-600 text-white text-xs font-semibold border border-teal-400/40 transition-all flex items-center gap-1.5"
          >
            <app-icon name="file-text" [size]="13"></app-icon>
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      <!-- Page Header & Individual Selector -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 live-beacon"></span>
            <span class="text-xs uppercase font-mono tracking-wider text-teal-800 font-bold">Individual Employee Record</span>
          </div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            {{ individual()?.first_name }} {{ individual()?.last_name }} — Personnel Details
          </h1>
          <p class="text-xs text-slate-500">
            Dedicated profile file, direct deposit payroll credentials, and biometric gate telemetry
          </p>
        </div>

        <!-- Individual Worker Selector -->
        <div class="flex items-center gap-2 self-start sm:self-auto bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-xs">
          <span class="text-[11px] font-bold text-slate-500 px-2 uppercase tracking-wider">Select Individual:</span>
          <select
            [(ngModel)]="selectedUserId"
            (ngModelChange)="onSelectIndividual()"
            class="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            @for (emp of workforce(); track emp.id) {
              <option [value]="emp.id">
                {{ emp.first_name }} {{ emp.last_name }} ({{ emp.employee_id }}) — {{ emp.department }}
              </option>
            }
          </select>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- INDIVIDUAL HERO IDENTITY BANNER                -->
      <!-- ============================================== -->
      <div class="p-6 bg-gradient-to-r from-slate-900 via-[#1B2C4E] to-[#0A7380] text-white rounded-2xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
          <img
            [src]="individual()?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
            [alt]="individual()?.first_name"
            class="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
          />
          <div>
            <div class="flex items-center gap-2.5">
              <h2 class="text-xl font-extrabold tracking-tight">{{ individual()?.first_name }} {{ individual()?.last_name }}</h2>
              <span
                class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="individual()?.status === 'active' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/30 text-rose-300 border border-rose-400/30'"
              >
                {{ individual()?.status?.replace('_', ' ') }}
              </span>
            </div>

            <div class="text-xs font-mono font-bold text-teal-200 mt-1">
              Plant ID: {{ individual()?.employee_id }}
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-300 mt-1.5">
              <span class="font-semibold uppercase tracking-wider text-teal-300">{{ individual()?.role }}</span>
              <span>•</span>
              <span>{{ individual()?.department }}</span>
              <span>•</span>
              <span>{{ individual()?.shift }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Individual Actions -->
        <div class="flex items-center gap-3">
          <a
            routerLink="/biometric"
            class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
          >
            <app-icon name="fingerprint" [size]="15" customClass="text-teal-300"></app-icon>
            <span>Biometric Gate Punch</span>
          </a>

          <button
            type="button"
            (click)="isEditingContact = !isEditingContact"
            class="px-4 py-2 bg-[#0A7380] hover:bg-[#085e68] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <app-icon name="settings" [size]="14"></app-icon>
            <span>{{ isEditingContact ? 'Cancel Editing' : 'Edit Contact Info' }}</span>
          </button>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- 4 DETAILED CARDS GRID (INDIVIDUAL DATA ONLY)   -->
      <!-- ============================================== -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- CARD 1: Personal & Contact Information -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                <app-icon name="user" [size]="16"></app-icon>
              </div>
              <span>1. Individual Personal & Contact Info</span>
            </div>
            <span class="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
              RLS Secured
            </span>
          </div>

          @if (!isEditingContact) {
            <div class="space-y-3 text-xs">
              <div class="flex justify-between py-1 border-b border-slate-50">
                <span class="text-slate-400">Full Legal Name:</span>
                <span class="font-bold text-slate-800">{{ individual()?.first_name }} {{ individual()?.last_name }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-50">
                <span class="text-slate-400">Primary Phone:</span>
                <span class="font-mono font-bold text-slate-800">{{ individual()?.phone || '+1 (555) 012-4411' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-50">
                <span class="text-slate-400">Emergency Contact:</span>
                <span class="font-medium text-slate-800">{{ individual()?.emergency_contact || 'Family Contact (+1 555-012-4412)' }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-400">Residential Address:</span>
                <span class="font-medium text-slate-800 text-right max-w-[220px]">{{ individual()?.address || 'Sector 4, Building B, Plant Zone' }}</span>
              </div>
            </div>
          } @else {
            <!-- Inline Contact Edit Form -->
            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  [(ngModel)]="editPhone"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  [(ngModel)]="editEmergency"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  [(ngModel)]="editAddress"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  (click)="isEditingContact = false"
                  class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  (click)="saveContactInfo()"
                  class="px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-sm"
                >
                  Save Updates
                </button>
              </div>
            </div>
          }
        </div>

        <!-- CARD 2: Station Assignment & Shift -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                <app-icon name="clock" [size]="16"></app-icon>
              </div>
              <span>2. Station & Shift Allocation</span>
            </div>
            <span class="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
              Station Verified
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Department / Line:</span>
              <span class="font-bold text-teal-800">{{ individual()?.department }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Assigned Shift:</span>
              <span class="font-semibold text-slate-800">{{ individual()?.shift }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">System Role:</span>
              <span class="font-bold text-slate-800 uppercase text-[11px]">{{ individual()?.role }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Plant Supervisor:</span>
              <span class="font-medium text-slate-700">Alexa Smom (QC Lead - Gate Alpha)</span>
            </div>
          </div>
        </div>

        <!-- CARD 3: Direct Deposit Bank & Payroll Ledger -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <app-icon name="payroll" [size]="16"></app-icon>
              </div>
              <span>3. Individual Bank & Payroll Ledger</span>
            </div>
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
              Direct Deposit Active
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Account Holder Name:</span>
              <span class="font-bold text-slate-800">{{ individual()?.bank_details?.account_name || individual()?.first_name + ' ' + individual()?.last_name }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Corporate Bank:</span>
              <span class="font-semibold text-slate-800">{{ individual()?.bank_details?.bank_name || 'Bank of America Industrial' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Account Number:</span>
              <span class="font-mono font-bold text-slate-900">{{ individual()?.bank_details?.account_number || '441098231049' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">IFSC / Routing Code:</span>
              <span class="font-mono font-bold text-teal-800">{{ individual()?.bank_details?.ifsc_code || 'BOFAUS3NXXX' }}</span>
            </div>
          </div>
        </div>

        <!-- CARD 4: Biometric & Gate Clearance -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                <app-icon name="fingerprint" [size]="16"></app-icon>
              </div>
              <span>4. Biometric Security & Gate Credentials</span>
            </div>
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
              Gate Authorized
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Biometric Template:</span>
              <span class="font-mono font-bold text-emerald-700">ISO-19794-ENROLLED</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Verification Modes:</span>
              <span class="font-semibold text-slate-800">TouchID Fingerprint & Facial AI HUD</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Access Tier:</span>
              <span class="font-bold text-teal-800 uppercase">Plant Floor & Main Logistics Dock</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Fast Gate Action:</span>
              <a routerLink="/biometric" class="text-xs font-bold text-teal-800 hover:underline">
                Open Biometric Gate Scanner →
              </a>
            </div>
          </div>
        </div>

      </div>

      <!-- ============================================== -->
      <!-- INDIVIDUAL ATTENDANCE & LEAVES (EXCLUSIVE)     -->
      <!-- Shows only THIS individual's records           -->
      <!-- ============================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Recent Individual Punches -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-900 text-sm">Individual Attendance Punches</h3>
              <p class="text-xs text-slate-400 mt-0.5">Telemetry verified for {{ individual()?.first_name }}</p>
            </div>
            <a routerLink="/attendance" class="text-xs text-teal-800 font-bold hover:underline">
              Terminal History →
            </a>
          </div>

          <div class="divide-y divide-slate-100 mt-2">
            @for (log of individualPunches(); track log.id) {
              <div class="py-3 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-slate-800 font-mono">{{ log.timestamp }}</div>
                  <div class="text-[10px] text-slate-400 capitalize">Method: {{ log.method }} • {{ log.notes || 'Normal Shift Punch' }}</div>
                </div>

                <span
                  class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase"
                  [ngClass]="log.type === 'check_in' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'"
                >
                  {{ log.type.replace('_', ' ') }}
                </span>
              </div>
            }
            @if (individualPunches().length === 0) {
              <div class="py-6 text-center text-xs text-slate-400 italic">
                No recent punches logged for this individual.
              </div>
            }
          </div>
        </div>

        <!-- Individual Leave Requests & Balance -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-900 text-sm">Individual Leave Portfolio</h3>
              <p class="text-xs text-slate-400 mt-0.5">Absence quota and submitted requests for {{ individual()?.first_name }}</p>
            </div>
            <a routerLink="/leaves" class="text-xs text-teal-800 font-bold hover:underline">
              Submit Request →
            </a>
          </div>

          <!-- Leave Balances -->
          <div class="grid grid-cols-3 gap-3 my-3">
            <div class="p-3 bg-teal-50 rounded-xl text-center border border-teal-100">
              <span class="text-[10px] uppercase font-bold text-teal-700">Annual</span>
              <div class="text-lg font-bold text-teal-900">18 Days</div>
            </div>
            <div class="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-100">
              <span class="text-[10px] uppercase font-bold text-emerald-700">Sick</span>
              <div class="text-lg font-bold text-emerald-900">8 Days</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
              <span class="text-[10px] uppercase font-bold text-slate-600">Casual</span>
              <div class="text-lg font-bold text-slate-800">4 Days</div>
            </div>
          </div>

          <!-- Recent Requests for this individual -->
          <div class="divide-y divide-slate-100">
            @for (leave of individualLeaves(); track leave.id) {
              <div class="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-slate-800 capitalize">{{ leave.leave_type }} Leave ({{ leave.start_date }} - {{ leave.end_date }})</div>
                  <div class="text-[10px] text-slate-400 italic">"{{ leave.reason }}"</div>
                </div>

                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  [ngClass]="{
                    'bg-amber-50 text-amber-700': leave.status === 'pending',
                    'bg-emerald-50 text-emerald-700': leave.status === 'approved',
                    'bg-rose-50 text-rose-700': leave.status === 'rejected'
                  }"
                >
                  {{ leave.status }}
                </span>
              </div>
            }
            @if (individualLeaves().length === 0) {
              <div class="py-4 text-center text-xs text-slate-400 italic">
                No leave requests filed for this employee.
              </div>
            }
          </div>
        </div>

      </div>

    </div>
  `
})
export class ProfileComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  workforce = this.supabaseService.workforce;
  attendanceLogs = this.supabaseService.attendanceLogs;
  leaveRequests = this.supabaseService.leaveRequests;

  // Selected individual defaults to current user or first worker
  selectedUserId = this.supabaseService.currentUser()?.id || '00000000-0000-0000-0000-000000000002';

  isEditingContact = false;
  editPhone = '';
  editAddress = '';
  editEmergency = '';

  private sub?: Subscription;

  individual = computed(() => {
    return this.workforce().find(w => w.id === this.selectedUserId) || this.supabaseService.currentUser();
  });

  individualPunches = computed(() => {
    const id = this.selectedUserId;
    return this.attendanceLogs().filter(log => log.user_id === id);
  });

  individualLeaves = computed(() => {
    const id = this.selectedUserId;
    return this.leaveRequests().filter(req => req.user_id === id);
  });

  ngOnInit() {
    this.sub = this.route.queryParams.subscribe(params => {
      if (params['id']) {
        const found = this.workforce().find(w => w.id === params['id'] || w.employee_id === params['id']);
        if (found) {
          this.selectedUserId = found.id;
        }
      }
      this.initEditFields();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  selectMyProfile() {
    const me = this.supabaseService.currentUser();
    if (me) {
      this.selectedUserId = me.id;
      this.router.navigate([], { queryParams: { id: me.id }, queryParamsHandling: 'merge' });
      this.initEditFields();
    }
  }

  onSelectIndividual() {
    this.isEditingContact = false;
    this.router.navigate([], { queryParams: { id: this.selectedUserId }, queryParamsHandling: 'merge' });
    this.initEditFields();
  }

  printDossier() {
    window.print();
  }

  private initEditFields() {
    const ind = this.individual();
    if (ind) {
      this.editPhone = ind.phone || '';
      this.editAddress = ind.address || '';
      this.editEmergency = ind.emergency_contact || '';
    }
  }

  async saveContactInfo() {
    await this.supabaseService.updateEmployeeContactInfo(this.selectedUserId, {
      phone: this.editPhone,
      address: this.editAddress,
      emergency_contact: this.editEmergency
    });
    this.isEditingContact = false;
  }
}
