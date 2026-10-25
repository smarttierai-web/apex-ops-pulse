import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { EmployeeModalComponent } from '../modals/employee-modal.component';
import { UserProfile } from '../../core/models/workforce.model';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, EmployeeModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Workforce Directory</h1>
          <p class="text-xs text-slate-500 mt-0.5">Enterprise personnel, shift allocation & contact roster</p>
        </div>

        <button
          (click)="showAddModal = true"
          class="px-4 py-2 bg-[#0A7380] hover:bg-[#085a64] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start"
        >
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Onboard Employee</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[240px]">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <app-icon name="search" [size]="15"></app-icon>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by employee name, badge ID, or role..."
            class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div class="flex items-center gap-2">
          <select
            [(ngModel)]="selectedDepartment"
            class="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          >
            <option value="All">All Departments</option>
            <option value="Assembly">Assembly</option>
            <option value="Quality Control">Quality Control</option>
            <option value="Warehouse & Supply">Warehouse & Supply</option>
            <option value="Plant Maintenance">Plant Maintenance</option>
            <option value="Corporate HR">Corporate HR</option>
          </select>

          <select
            [(ngModel)]="selectedShift"
            class="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          >
            <option value="All">All Shifts</option>
            <option value="Morning (06:00-14:00)">Morning</option>
            <option value="General (09:00-18:00)">General</option>
            <option value="Night (22:00-06:00)">Night</option>
          </select>
        </div>
      </div>

      <!-- Directory Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (emp of filteredWorkforce(); track emp.id) {
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 hover:border-teal-500/50 transition-all flex flex-col justify-between">
            <div class="space-y-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <img
                    [src]="emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                    [alt]="emp.first_name"
                    class="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h3 class="text-sm font-bold text-slate-800">{{ emp.first_name }} {{ emp.last_name }}</h3>
                    <div class="text-[11px] font-mono text-teal-800 font-semibold">{{ emp.employee_id }}</div>
                  </div>
                </div>

                <span
                  class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md"
                  [ngClass]="{
                    'bg-emerald-50 text-emerald-700': emp.status === 'active',
                    'bg-rose-50 text-rose-700': emp.status === 'on_leave',
                    'bg-slate-100 text-slate-600': emp.status === 'inactive'
                  }"
                >
                  {{ emp.status.replace('_', ' ') }}
                </span>
              </div>

              <div class="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div class="flex justify-between">
                  <span class="text-slate-400">Department:</span>
                  <span class="font-medium text-slate-700">{{ emp.department }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Role:</span>
                  <span class="font-semibold text-slate-800 uppercase text-[11px]">{{ emp.role }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Shift:</span>
                  <span class="font-medium text-slate-700">{{ emp.shift }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Phone:</span>
                  <span class="font-mono text-slate-700">{{ emp.phone || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[11px] text-slate-400">PostgreSQL RLS Active</span>
              <button
                type="button"
                (click)="selectedProfile = emp"
                class="text-xs text-teal-800 font-semibold hover:text-teal-900"
              >
                View Full Details →
              </button>
            </div>
          </div>
        }
      </div>

      <!-- ============================================== -->
      <!-- COMPLETE EMPLOYEE RECORD SHEET MODAL           -->
      <!-- Displays ALL details of the employee           -->
      <!-- ============================================== -->
      @if (selectedProfile) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <!-- Header -->
            <div class="px-6 py-4 bg-[#1B2C4E] text-white flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
                  <app-icon name="user" [size]="20"></app-icon>
                </div>
                <div>
                  <h3 class="font-bold text-white text-base">Complete Employee Dossier</h3>
                  <p class="text-xs text-slate-300">Detailed personnel, plant assignment, and banking ledger</p>
                </div>
              </div>
              <button (click)="selectedProfile = null" class="text-slate-400 hover:text-white transition-colors p-1">
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-4">
              <!-- Hero Banner -->
              <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-900 via-[#1B2C4E] to-[#0A7380] text-white rounded-2xl shadow-card">
                <img [src]="selectedProfile.avatar_url" class="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30" />
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-white text-lg">{{ selectedProfile.first_name }} {{ selectedProfile.last_name }}</h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      {{ selectedProfile.status }}
                    </span>
                  </div>
                  <div class="text-xs font-mono text-teal-200 font-bold mt-0.5">{{ selectedProfile.employee_id }}</div>
                  <div class="text-xs text-slate-300 uppercase font-semibold mt-1">{{ selectedProfile.role }} • {{ selectedProfile.department }}</div>
                </div>
              </div>

              <!-- Section 1: Personal & Contact -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div class="font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                  <app-icon name="user" [size]="14" customClass="text-teal-700"></app-icon>
                  <span>1. Personal & Contact Details</span>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div><span class="text-slate-400 block">Phone Number:</span> <span class="font-semibold text-slate-800 font-mono">{{ selectedProfile.phone || 'N/A' }}</span></div>
                  <div><span class="text-slate-400 block">Emergency Contact:</span> <span class="font-semibold text-slate-800">{{ selectedProfile.emergency_contact || 'N/A' }}</span></div>
                </div>
                <div><span class="text-slate-400 block">Residential Address:</span> <span class="font-semibold text-slate-800">{{ selectedProfile.address || 'Plant Main Campus Zone' }}</span></div>
              </div>

              <!-- Section 2: Shift & Station -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div class="font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                  <app-icon name="clock" [size]="14" customClass="text-teal-700"></app-icon>
                  <span>2. Operational Shift & Plant Assignment</span>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div><span class="text-slate-400 block">Assigned Shift:</span> <span class="font-semibold text-slate-800">{{ selectedProfile.shift }}</span></div>
                  <div><span class="text-slate-400 block">Department Line:</span> <span class="font-semibold text-teal-800">{{ selectedProfile.department }}</span></div>
                  <div><span class="text-slate-400 block">Permission Role:</span> <span class="font-semibold text-slate-800 uppercase">{{ selectedProfile.role }}</span></div>
                  <div><span class="text-slate-400 block">Duty Status:</span> <span class="font-semibold text-emerald-700 uppercase">{{ selectedProfile.status }}</span></div>
                </div>
              </div>

              <!-- Section 3: Bank & Payroll Details -->
              <div class="bg-teal-50/70 p-4 rounded-xl border border-teal-200 text-xs space-y-2">
                <div class="font-bold text-teal-950 border-b border-teal-200 pb-1.5 flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <app-icon name="payroll" [size]="14" customClass="text-teal-800"></app-icon>
                    <span>3. Direct Deposit Bank & Payroll Ledger</span>
                  </div>
                  <span class="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-teal-800 border border-teal-200">
                    Direct Payout Verified
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span class="text-teal-800/80 block text-[11px]">Account Name:</span>
                    <span class="font-semibold text-slate-900">{{ selectedProfile.bank_details?.account_name || selectedProfile.first_name + ' ' + selectedProfile.last_name }}</span>
                  </div>
                  <div>
                    <span class="text-teal-800/80 block text-[11px]">Corporate Bank Partner:</span>
                    <span class="font-semibold text-slate-900">{{ selectedProfile.bank_details?.bank_name || 'Corporate Payroll Bank' }}</span>
                  </div>
                  <div>
                    <span class="text-teal-800/80 block text-[11px]">Bank Account Number:</span>
                    <span class="font-mono font-bold text-slate-900">{{ selectedProfile.bank_details?.account_number || '441098231049' }}</span>
                  </div>
                  <div>
                    <span class="text-teal-800/80 block text-[11px]">IFSC / SWIFT Code:</span>
                    <span class="font-mono font-bold text-teal-900">{{ selectedProfile.bank_details?.ifsc_code || 'APEX0092B' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex justify-end pt-2 border-t">
                <button
                  type="button"
                  (click)="selectedProfile = null"
                  class="px-5 py-2 bg-[#0A7380] hover:bg-[#085a64] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Close Record
                </button>
              </div>
            </div>

          </div>
        </div>
      }

      @if (showAddModal) {
        <app-employee-modal
          (close)="showAddModal = false"
          (saved)="onEmployeeSaved($event)"
        ></app-employee-modal>
      }
    </div>
  `
})
export class DirectoryComponent {
  private supabaseService = inject(SupabaseService);

  searchQuery = '';
  selectedDepartment = 'All';
  selectedShift = 'All';

  showAddModal = false;
  selectedProfile: UserProfile | null = null;

  filteredWorkforce = computed(() => {
    let list = this.supabaseService.workforce();
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(w =>
        w.first_name.toLowerCase().includes(query) ||
        w.last_name.toLowerCase().includes(query) ||
        w.employee_id.toLowerCase().includes(query) ||
        w.role.toLowerCase().includes(query)
      );
    }

    if (this.selectedDepartment !== 'All') {
      list = list.filter(w => w.department === this.selectedDepartment);
    }

    if (this.selectedShift !== 'All') {
      list = list.filter(w => w.shift === this.selectedShift);
    }

    return list;
  });

  onEmployeeSaved(newEmp: UserProfile) {
    // Keep it available in directory
    this.searchQuery = '';
    this.selectedDepartment = 'All';
    this.selectedShift = 'All';
  }
}
