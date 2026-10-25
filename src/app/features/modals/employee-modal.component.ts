import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { DepartmentType, ShiftType, UserRole, UserProfile, BankDetails } from '../../core/models/workforce.model';

// Custom validator for employee ID format (e.g., AOP-1049)
function employeeIdValidator(control: AbstractControl) {
  if (!control.value) return null;
  const valid = /^AOP-\d{4}$/.test(control.value);
  return valid ? null : { invalidEmployeeId: true };
}

// Custom validator for bank account (minimum 8 digits, only numbers)
function bankAccountValidator(control: AbstractControl) {
  if (!control.value) return null;
  const valid = /^\d{8,18}$/.test(control.value.trim());
  return valid ? null : { invalidAccountNumber: true };
}

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-[#1B2C4E] text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <app-icon [name]="viewMode === 'form' ? 'user' : 'check-circle'" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-semibold leading-none">
                {{ viewMode === 'form' ? 'Onboard New Workforce Member' : 'Employee Details Record' }}
              </h3>
              <p class="text-xs text-slate-300 mt-1">
                {{ viewMode === 'form' ? 'Register plant employee, allocate shift, and setup payroll' : 'Complete personal, operational and banking file created in database' }}
              </p>
            </div>
          </div>
          <button (click)="handleClose()" class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg">
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <!-- ============================================== -->
        <!-- VIEW 1: DATA ENTRY FORM                        -->
        <!-- ============================================== -->
        <ng-container *ngIf="viewMode === 'form'">
          <!-- Form Step Tabs -->
          <div class="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold px-6 pt-3 gap-6 shrink-0">
            <button
              type="button"
              (click)="activeTab = 'personal'"
              [class]="activeTab === 'personal' ? 'text-teal-800 border-b-2 border-teal-800 pb-2.5' : 'text-slate-500 pb-2.5 hover:text-slate-700'"
            >
              1. Personal Info
            </button>
            <button
              type="button"
              (click)="activeTab = 'shift'"
              [class]="activeTab === 'shift' ? 'text-teal-800 border-b-2 border-teal-800 pb-2.5' : 'text-slate-500 pb-2.5 hover:text-slate-700'"
            >
              2. Shift & Plant Station
            </button>
            <button
              type="button"
              (click)="activeTab = 'bank'"
              [class]="activeTab === 'bank' ? 'text-teal-800 border-b-2 border-teal-800 pb-2.5' : 'text-slate-500 pb-2.5 hover:text-slate-700'"
            >
              3. Bank & Payroll
            </button>
          </div>

          <!-- Form Body -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex-1 overflow-y-auto p-6 space-y-4">
            
            <!-- TAB 1: PERSONAL -->
            <div *ngIf="activeTab === 'personal'" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    formControlName="first_name"
                    placeholder="e.g. Jordan"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                  <span *ngIf="form.get('first_name')?.touched && form.get('first_name')?.invalid" class="text-[11px] text-rose-500 font-medium">
                    First name is required.
                  </span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    formControlName="last_name"
                    placeholder="e.g. Miller"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                  <span *ngIf="form.get('last_name')?.touched && form.get('last_name')?.invalid" class="text-[11px] text-rose-500 font-medium">
                    Last name is required.
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Avatar Photo URL</label>
                <input
                  type="text"
                  formControlName="avatar_url"
                  placeholder="https://images.unsplash.com/photo-..."
                  class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
                <p class="text-[11px] text-slate-400 mt-1">Leave empty or keep default image for profile card.</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    formControlName="phone"
                    placeholder="+1 (555) 018-9921"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                  <span *ngIf="form.get('phone')?.touched && form.get('phone')?.invalid" class="text-[11px] text-rose-500 font-medium">
                    Valid phone number is required.
                  </span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact *</label>
                  <input
                    type="text"
                    formControlName="emergency_contact"
                    placeholder="Contact Name (+1 555-xxx-xxxx)"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Residential Address *</label>
                <input
                  type="text"
                  formControlName="address"
                  placeholder="Sector 3, Manufacturing City, Plant Zone"
                  class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>
            </div>

            <!-- TAB 2: SHIFT & PLANT STATION -->
            <div *ngIf="activeTab === 'shift'" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Employee ID * (Format: AOP-XXXX)</label>
                  <input
                    type="text"
                    formControlName="employee_id"
                    placeholder="e.g. AOP-1049"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent uppercase font-mono"
                  />
                  <span *ngIf="form.get('employee_id')?.touched && form.get('employee_id')?.errors?.['invalidEmployeeId']" class="text-[11px] text-rose-500 font-medium">
                    Must follow format AOP-1234.
                  </span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Role Permission *</label>
                  <select
                    formControlName="role"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-white"
                  >
                    <option value="operator">Operator (Line Staff)</option>
                    <option value="supervisor">Supervisor (Shift Lead)</option>
                    <option value="hr_manager">HR Manager (Admin Access)</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    formControlName="department"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-white"
                  >
                    <option value="Assembly">Assembly Line</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Warehouse & Supply">Warehouse & Supply</option>
                    <option value="Plant Maintenance">Plant Maintenance</option>
                    <option value="Corporate HR">Corporate HR</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Assigned Shift *</label>
                  <select
                    formControlName="shift"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-white"
                  >
                    <option value="Morning (06:00-14:00)">Morning (06:00-14:00)</option>
                    <option value="General (09:00-18:00)">General (09:00-18:00)</option>
                    <option value="Night (22:00-06:00)">Night (22:00-06:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Initial Duty Status</label>
                <select
                  formControlName="status"
                  class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-white"
                >
                  <option value="active">Active (On Duty)</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <!-- TAB 3: BANK DETAILS -->
            <div *ngIf="activeTab === 'bank'" class="space-y-4">
              <div class="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
                <app-icon name="shield" [size]="16" customClass="text-teal-700 shrink-0"></app-icon>
                <span>Bank details are encrypted and stored in PostgreSQL with strict Row Level Security.</span>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    formControlName="account_name"
                    placeholder="e.g. Jordan Miller"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    formControlName="account_number"
                    placeholder="e.g. 981244510291"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent font-mono"
                  />
                  <span *ngIf="form.get('account_number')?.touched && form.get('account_number')?.errors?.['invalidAccountNumber']" class="text-[11px] text-rose-500 font-medium">
                    Account number must be 8-18 numeric digits.
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    formControlName="bank_name"
                    placeholder="e.g. JPMorgan Chase Corp"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">IFSC / SWIFT Code *</label>
                  <input
                    type="text"
                    formControlName="ifsc_code"
                    placeholder="e.g. CHASUS33XXX"
                    class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div class="text-xs text-slate-500">
                * Required enterprise fields
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="handleClose()"
                  class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  *ngIf="activeTab !== 'bank'"
                  type="button"
                  (click)="nextTab()"
                  class="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
                >
                  Next Section →
                </button>

                <button
                  *ngIf="activeTab === 'bank'"
                  type="submit"
                  [disabled]="form.invalid"
                  class="px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <app-icon name="check" [size]="14"></app-icon>
                  <span>Save & Onboard Employee</span>
                </button>
              </div>
            </div>

          </form>
        </ng-container>

        <!-- ============================================== -->
        <!-- VIEW 2: COMPLETE DETAILS DISPLAY VIEW          -->
        <!-- Displayed immediately after entering details!  -->
        <!-- ============================================== -->
        <ng-container *ngIf="viewMode === 'details' && createdEmployee">
          <div class="flex-1 overflow-y-auto p-6 space-y-5">
            
            <!-- Success Status Alert Banner -->
            <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <app-icon name="check-circle" [size]="20"></app-icon>
                </div>
                <div>
                  <h4 class="font-bold text-emerald-950 text-sm">Employee Successfully Enrolled</h4>
                  <p class="text-xs text-emerald-800 mt-0.5">
                    Profile, shift allocation, and encrypted bank credentials have been synchronized to database.
                  </p>
                </div>
              </div>
              <span class="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full uppercase">
                Active Record
              </span>
            </div>

            <!-- Employee Hero Card -->
            <div class="p-5 bg-gradient-to-r from-slate-900 via-[#1B2C4E] to-[#0A7380] text-white rounded-2xl shadow-card flex items-center justify-between">
              <div class="flex items-center gap-4">
                <img
                  [src]="createdEmployee.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                  [alt]="createdEmployee.first_name"
                  class="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shadow-md"
                />
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-bold">{{ createdEmployee.first_name }} {{ createdEmployee.last_name }}</h3>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      {{ createdEmployee.status }}
                    </span>
                  </div>
                  <div class="text-xs text-teal-200 font-mono font-bold mt-0.5">{{ createdEmployee.employee_id }}</div>
                  <div class="text-xs text-slate-300 mt-1 uppercase tracking-wider font-semibold">
                    {{ createdEmployee.role }} • {{ createdEmployee.department }}
                  </div>
                </div>
              </div>

              <div class="text-right hidden sm:block">
                <span class="text-[11px] text-teal-200">Factory Floor Badge</span>
                <div class="text-xs font-mono font-bold text-white mt-1">APEX-PASS-PASSKEY</div>
              </div>
            </div>

            <!-- Details 3-Section Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- 1. Personal & Contact Details -->
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <div class="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-800">
                  <app-icon name="user" [size]="15" customClass="text-teal-700"></app-icon>
                  <span>1. Personal & Contact Information</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Full Legal Name:</span>
                  <span class="font-semibold text-slate-800">{{ createdEmployee.first_name }} {{ createdEmployee.last_name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Direct Phone:</span>
                  <span class="font-mono font-semibold text-slate-800">{{ createdEmployee.phone }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Emergency Contact:</span>
                  <span class="font-medium text-slate-800">{{ createdEmployee.emergency_contact }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Residential Address:</span>
                  <span class="font-medium text-slate-800 text-right max-w-[200px]">{{ createdEmployee.address }}</span>
                </div>
              </div>

              <!-- 2. Shift & Plant Assignment -->
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <div class="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-800">
                  <app-icon name="clock" [size]="15" customClass="text-teal-700"></app-icon>
                  <span>2. Station & Shift Allocation</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Assigned Department:</span>
                  <span class="font-semibold text-teal-800">{{ createdEmployee.department }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Operational Shift:</span>
                  <span class="font-medium text-slate-800">{{ createdEmployee.shift }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">System Role:</span>
                  <span class="font-bold text-slate-800 uppercase text-[11px]">{{ createdEmployee.role }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Onboarding Date:</span>
                  <span class="font-mono text-slate-700">Today ({{ createdEmployee.created_at | date:'d MMM yyyy, h:mm a' }})</span>
                </div>
              </div>

            </div>

            <!-- 3. Banking & Payroll Details (Complete Record) -->
            <div class="bg-teal-50/60 p-4 rounded-2xl border border-teal-200 text-xs space-y-2.5">
              <div class="flex items-center justify-between pb-2 border-b border-teal-200">
                <div class="flex items-center gap-2 font-bold text-teal-950">
                  <app-icon name="payroll" [size]="16" customClass="text-teal-800"></app-icon>
                  <span>3. Direct Deposit Bank & Payroll Ledger</span>
                </div>
                <span class="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 uppercase">
                  Direct Clearing Enabled
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span class="text-teal-700/80 block text-[11px]">Account Holder Name:</span>
                  <span class="font-semibold text-slate-900">{{ createdEmployee.bank_details?.account_name || createdEmployee.first_name + ' ' + createdEmployee.last_name }}</span>
                </div>
                <div>
                  <span class="text-teal-700/80 block text-[11px]">Corporate Bank Partner:</span>
                  <span class="font-semibold text-slate-900">{{ createdEmployee.bank_details?.bank_name }}</span>
                </div>
                <div>
                  <span class="text-teal-700/80 block text-[11px]">Account Number:</span>
                  <span class="font-mono font-bold text-slate-900">{{ createdEmployee.bank_details?.account_number }}</span>
                </div>
                <div>
                  <span class="text-teal-700/80 block text-[11px]">IFSC / SWIFT Code:</span>
                  <span class="font-mono font-bold text-teal-900">{{ createdEmployee.bank_details?.ifsc_code }}</span>
                </div>
              </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                (click)="onboardAnother()"
                class="px-4 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Onboard Another Employee</span>
              </button>

              <button
                type="button"
                (click)="handleClose()"
                class="px-6 py-2.5 text-xs font-bold text-white bg-[#0A7380] hover:bg-[#085a64] rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <app-icon name="check" [size]="15"></app-icon>
                <span>Done & View Directory</span>
              </button>
            </div>

          </div>
        </ng-container>

      </div>
    </div>
  `
})
export class EmployeeModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<UserProfile>();

  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  viewMode: 'form' | 'details' = 'form';
  activeTab: 'personal' | 'shift' | 'bank' = 'personal';

  createdEmployee: UserProfile | null = null;

  form: FormGroup = this.createForm();

  private createForm(): FormGroup {
    const nextEmpId = `AOP-${Math.floor(1050 + Math.random() * 900)}`;
    const f = this.fb.group({
      // Tab 1
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      avatar_url: ['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'],
      phone: ['+1 (555) 019-3388', [Validators.required]],
      emergency_contact: ['Family Contact (+1 555-019-3389)', [Validators.required]],
      address: ['Sector 2, Manufacturing Hub'],

      // Tab 2
      employee_id: [nextEmpId, [Validators.required, employeeIdValidator]],
      role: ['operator', [Validators.required]],
      department: ['Assembly', [Validators.required]],
      shift: ['Morning (06:00-14:00)', [Validators.required]],
      status: ['active', [Validators.required]],

      // Tab 3
      account_name: ['', [Validators.required]],
      account_number: ['', [Validators.required, bankAccountValidator]],
      bank_name: ['Apex Corporate Partner Bank', [Validators.required]],
      ifsc_code: ['APEX0092B', [Validators.required]]
    });

    f.get('first_name')?.valueChanges.subscribe(() => this.syncAccountName());
    f.get('last_name')?.valueChanges.subscribe(() => this.syncAccountName());

    return f;
  }

  private syncAccountName() {
    if (!this.form.get('account_name')?.dirty) {
      const fn = this.form.get('first_name')?.value || '';
      const ln = this.form.get('last_name')?.value || '';
      this.form.patchValue({ account_name: `${fn} ${ln}`.trim() }, { emitEvent: false });
    }
  }

  nextTab() {
    if (this.activeTab === 'personal') this.activeTab = 'shift';
    else if (this.activeTab === 'shift') this.activeTab = 'bank';
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;

    const profileData = {
      employee_id: val.employee_id,
      first_name: val.first_name,
      last_name: val.last_name,
      avatar_url: val.avatar_url,
      role: val.role as UserRole,
      department: val.department as DepartmentType,
      shift: val.shift as ShiftType,
      phone: val.phone,
      address: val.address,
      emergency_contact: val.emergency_contact,
      status: val.status
    };

    const bankData: BankDetails = {
      user_id: '',
      account_name: val.account_name,
      account_number: val.account_number,
      bank_name: val.bank_name,
      ifsc_code: val.ifsc_code
    };

    const result = await this.supabaseService.createEmployee(profileData, bankData);
    this.createdEmployee = result;
    this.viewMode = 'details'; // Transition to full details view!
    this.saved.emit(result);
  }

  onboardAnother() {
    this.form = this.createForm();
    this.createdEmployee = null;
    this.activeTab = 'personal';
    this.viewMode = 'form';
  }

  handleClose() {
    this.close.emit();
  }
}
