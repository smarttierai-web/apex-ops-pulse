import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Payroll & Disbursement Ledger</h1>
          <p class="text-xs text-slate-500 mt-0.5">Automated manufacturing shift compensation, deductions, and net payouts</p>
        </div>

        <button
          (click)="processPayroll()"
          class="px-4 py-2 bg-[#0A7380] hover:bg-[#085a64] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start"
        >
          <app-icon name="payroll" [size]="14"></app-icon>
          <span>Process Monthly Payroll Batch</span>
        </button>
      </div>

      <!-- Payroll Summary Banner -->
      <div class="bg-gradient-to-r from-[#1B2C4E] to-[#0A7380] rounded-2xl p-6 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span class="text-xs font-semibold text-teal-200 uppercase tracking-wider">Payroll Cycle</span>
          <h2 class="text-2xl font-bold mt-1">October 2026 Active Disbursement</h2>
          <p class="text-xs text-slate-200 mt-1">
            Current Status: Processing ({{ metrics().payrollProgressPercent }}% Automated Calculations Validated)
          </p>

          <div class="w-full max-w-md h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div
              class="h-full bg-emerald-400 rounded-full transition-all duration-500"
              [style.width.%]="metrics().payrollProgressPercent"
            ></div>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="border-l border-white/20 pl-6">
            <div class="text-xs text-teal-200">Total Net Disbursed</div>
            <div class="text-xl font-bold text-white">$18,400.00</div>
          </div>
          <div class="border-l border-white/20 pl-6">
            <div class="text-xs text-teal-200">Shift Allowances</div>
            <div class="text-xl font-bold text-white">+$1,550.00</div>
          </div>
        </div>
      </div>

      <!-- Payroll Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-sm">Disbursement Register</h3>
          <span class="text-xs text-slate-400 font-mono">Cycle: OCT-2026-PAY-V1</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b">
              <tr>
                <th class="py-3 px-4">Employee</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4 text-right">Base Salary</th>
                <th class="py-3 px-4 text-right">Shift Allowance</th>
                <th class="py-3 px-4 text-right">Deductions</th>
                <th class="py-3 px-4 text-right">Net Payable</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (item of payrollRecords(); track item.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-3">
                      <img
                        [src]="item.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                        class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div class="font-bold text-slate-800">{{ item.user_profile?.first_name }} {{ item.user_profile?.last_name }}</div>
                        <div class="text-[10px] font-mono text-slate-400">{{ item.user_profile?.employee_id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-slate-600 font-medium">{{ item.user_profile?.department }}</td>
                  <td class="py-3.5 px-4 text-right font-mono text-slate-700">\${{ item.base_salary | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4 text-right font-mono text-emerald-600 font-medium">+\${{ item.shift_allowances | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4 text-right font-mono text-rose-500">-\${{ item.deductions | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-900">\${{ item.net_payable | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4 text-center">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                      [ngClass]="{
                        'bg-teal-50 text-teal-800': item.status === 'processing',
                        'bg-emerald-50 text-emerald-700': item.status === 'disbursed',
                        'bg-slate-100 text-slate-600': item.status === 'draft'
                      }"
                    >
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class PayrollComponent {
  private supabaseService = inject(SupabaseService);

  payrollRecords = this.supabaseService.payrollRecords;
  metrics = this.supabaseService.metrics;

  processPayroll() {
    this.supabaseService.processPayrollRun();
  }
}
