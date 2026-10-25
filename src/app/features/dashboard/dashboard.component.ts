import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { EmployeeModalComponent } from '../modals/employee-modal.component';
import { BroadcastModalComponent } from '../modals/broadcast-modal.component';
import { AttendanceOverrideModalComponent } from '../modals/attendance-override-modal.component';
import { SettingsModalComponent } from '../modals/settings-modal.component';
import { LeaveRequest } from '../../core/models/workforce.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    EmployeeModalComponent,
    BroadcastModalComponent,
    AttendanceOverrideModalComponent,
    SettingsModalComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Top Section Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Administrative Overview</h1>
          <p class="text-xs text-slate-500 mt-0.5">Real-time telemetry and plant workforce operations feed</p>
        </div>

        <!-- Supabase Connection Indicator & Quick Action -->
        <div class="flex items-center gap-3">
          <div
            (click)="showSettingsModal = true"
            class="cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 transition-all hover:shadow-sm"
            [ngClass]="supabaseService.isLiveConnected() ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-300 text-slate-700'"
          >
            <span class="w-2 h-2 rounded-full" [ngClass]="supabaseService.isLiveConnected() ? 'bg-emerald-500 live-beacon' : 'bg-teal-600'"></span>
            <span class="font-medium text-[11px]">{{ supabaseService.isLiveConnected() ? 'PostgreSQL Realtime Active' : 'Reactive Engine (Active)' }}</span>
            <app-icon name="database" [size]="12" customClass="opacity-60"></app-icon>
          </div>

          <button
            (click)="showAttendanceModal = true"
            class="px-3.5 py-1.5 bg-[#0A7380] hover:bg-[#085a64] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <app-icon name="radio" [size]="14"></app-icon>
            <span>Simulate Live Punch</span>
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- 4 KPI METRICS CARDS ROW (Matches Mockup)   -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- CARD 1: Total Employees -->
        <div class="relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br from-[#0A7380] via-[#0E8592] to-[#064E57] shadow-card transition-all hover:-translate-y-0.5">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-medium text-teal-100/90 tracking-wide uppercase">Total Employees</span>
              <div class="text-2xl font-bold mt-1 tracking-tight">{{ metrics().totalEmployees }} Active</div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-teal-100">
              <app-icon name="users" [size]="20"></app-icon>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-white/15">
            <a routerLink="/directory" class="text-xs font-medium text-teal-100 hover:text-white flex items-center gap-1 group transition-colors">
              <span>View Directory</span>
              <app-icon name="arrow-up-right" [size]="13" customClass="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></app-icon>
            </a>
          </div>
        </div>

        <!-- CARD 2: On Leave Today -->
        <div class="relative overflow-hidden rounded-2xl p-5 text-white bg-[#1B2C4E] shadow-card transition-all hover:-translate-y-0.5 border border-[#263C66]">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-medium text-slate-300 tracking-wide uppercase">On Leave Today</span>
              <div class="text-2xl font-bold mt-1 tracking-tight">{{ metrics().onLeaveToday }} Employees</div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
              <app-icon name="leave" [size]="20"></app-icon>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-white/10 text-xs text-slate-300">
            Pending Requests: <span class="font-semibold text-rose-300">{{ metrics().pendingLeaveRequestsCount }}</span>
          </div>
        </div>

        <!-- CARD 3: Checked-In Today -->
        <div class="relative overflow-hidden rounded-2xl p-5 text-white bg-[#0A7380] shadow-card transition-all hover:-translate-y-0.5">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-medium text-teal-100/90 tracking-wide uppercase">Checked-In Today</span>
              <div class="text-2xl font-bold mt-1 tracking-tight">
                {{ metrics().checkedInToday }} <span class="text-lg font-normal text-teal-200">/ {{ metrics().totalShiftCapacity }}</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-300">
              <app-icon name="check-circle" [size]="20"></app-icon>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-white/15 text-xs text-teal-100">
            Average Check-in: <span class="font-semibold text-white">{{ metrics().averageCheckInTime }}</span>
          </div>
        </div>

        <!-- CARD 4: Pending Actions -->
        <div class="relative overflow-hidden rounded-2xl p-5 text-white bg-[#1B2C4E] shadow-card transition-all hover:-translate-y-0.5 border border-[#263C66]">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-medium text-slate-300 tracking-wide uppercase">Pending Actions</span>
              <div class="text-2xl font-bold mt-1 tracking-tight">{{ metrics().pendingActionsTotal }}</div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
              <app-icon name="alert-circle" [size]="20"></app-icon>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-white/10 text-xs text-slate-300 truncate">
            {{ metrics().pendingTimecards }} Timecards, {{ metrics().pendingLeaves }} Leaves, {{ metrics().pendingReimbursements }} Reimbursements
          </div>
        </div>

      </div>

      <!-- ========================================== -->
      <!-- MAIN OPERATIONAL GRID (Feed & Actions)     -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- LEFT 2 COLUMNS: Daily Activity & Leaves -->
        <div class="lg:col-span-2 space-y-6">

          <!-- CARD: Daily Activity Logs -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 tracking-tight">Daily Activity Logs</h2>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 live-beacon"></span>
                  <p class="text-xs text-slate-500">Real-time check-in/check-out monitor</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  (click)="showAttendanceModal = true"
                  class="text-xs text-teal-800 font-semibold hover:text-teal-900 flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 transition-colors"
                >
                  <app-icon name="plus" [size]="13"></app-icon>
                  <span>Manual Punch</span>
                </button>
              </div>
            </div>

            <!-- Tabular Feed -->
            <div class="overflow-x-auto mt-2">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <th class="py-3 px-2">Name</th>
                    <th class="py-3 px-2">Timestamp</th>
                    <th class="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (log of attendanceLogs(); track log.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors group">
                      <!-- Name with Avatar -->
                      <td class="py-3 px-2">
                        <div class="flex items-center gap-3">
                          <img
                            [src]="log.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                            [alt]="log.user_profile?.first_name || 'Worker'"
                            class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div class="font-semibold text-slate-800">
                              {{ log.user_profile?.first_name }} {{ log.user_profile?.last_name }}
                            </div>
                            <div class="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                              <span>{{ log.user_profile?.employee_id }}</span>
                              <span>•</span>
                              <span>{{ log.method }}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <!-- Timestamp -->
                      <td class="py-3 px-2 text-slate-600 font-medium whitespace-nowrap">
                        {{ log.timestamp }}
                      </td>

                      <!-- Status Badge -->
                      <td class="py-3 px-2 text-right">
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
          </div>

          <!-- CARD: Recent Leave Requests -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 tracking-tight">Recent Leave Requests</h2>
                <p class="text-xs text-slate-500 mt-0.5">Approve or reject scheduled shift absences</p>
              </div>

              <a routerLink="/leaves" class="text-xs text-teal-800 font-semibold hover:text-teal-900 flex items-center gap-1">
                <span>All Requests ({{ metrics().pendingLeaveRequestsCount }})</span>
                <app-icon name="arrow-up-right" [size]="13"></app-icon>
              </a>
            </div>

            <!-- Leave Table -->
            <div class="overflow-x-auto mt-2">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <th class="py-3 px-2">Employee name</th>
                    <th class="py-3 px-2">Leave type</th>
                    <th class="py-3 px-2">Date</th>
                    <th class="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (leave of leaveRequests(); track leave.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <!-- Employee -->
                      <td class="py-3 px-2">
                        <div class="flex items-center gap-3">
                          <img
                            [src]="leave.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'"
                            [alt]="leave.user_profile?.first_name || 'Staff'"
                            class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span class="font-semibold text-slate-800">
                            {{ leave.user_profile?.first_name }} {{ leave.user_profile?.last_name }}
                          </span>
                        </div>
                      </td>

                      <!-- Leave type -->
                      <td class="py-3 px-2 text-slate-600 capitalize font-medium">
                        {{ leave.leave_type }}
                      </td>

                      <!-- Date range -->
                      <td class="py-3 px-2 text-slate-600 font-medium whitespace-nowrap">
                        {{ leave.start_date | date:'d MMM' }} - {{ leave.end_date | date:'d MMM' }}
                      </td>

                      <!-- Action Buttons: Approve / Reject -->
                      <td class="py-3 px-2 text-right">
                        @if (leave.status === 'pending') {
                          <div class="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
                            <button
                              type="button"
                              (click)="onApproveLeave(leave)"
                              class="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Approve Request"
                            >
                              Approve
                            </button>
                            <span class="text-slate-300">/</span>
                            <button
                              type="button"
                              (click)="onRejectLeave(leave)"
                              class="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Reject Request"
                            >
                              Reject
                            </button>
                          </div>
                        } @else if (leave.status === 'approved') {
                          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                            <app-icon name="check" [size]="12"></app-icon>
                            Approved
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                            <app-icon name="x" [size]="12"></app-icon>
                            Rejected
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: Quick Admin Actions & Payroll Status -->
        <div class="space-y-6">

          <!-- CARD: Quick Admin Actions (Matches Mockup exact teal buttons) -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <h2 class="text-sm font-bold text-slate-900 tracking-tight mb-4">Quick Admin Actions</h2>
            
            <div class="flex flex-col gap-3">
              <!-- Button 1: Add New Employee -->
              <button
                type="button"
                (click)="showEmployeeModal = true"
                class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#0A7380] hover:bg-[#085e68] shadow-sm transition-all flex items-center justify-center gap-2 group"
              >
                <app-icon name="plus" [size]="16" customClass="group-hover:rotate-90 transition-transform"></app-icon>
                <span>Add New Employee</span>
              </button>

              <!-- Button 2: Process Payroll -->
              <button
                type="button"
                (click)="onProcessPayroll()"
                class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#0A7380] hover:bg-[#085e68] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <app-icon name="payroll" [size]="16"></app-icon>
                <span>Process Payroll</span>
              </button>

              <!-- Button 3: Broadcast Announcement -->
              <button
                type="button"
                (click)="showBroadcastModal = true"
                class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#0A7380] hover:bg-[#085e68] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <app-icon name="megaphone" [size]="16"></app-icon>
                <span>Broadcast Announcement</span>
              </button>

              <!-- Button 4: Approve Attendance -->
              <button
                type="button"
                (click)="showAttendanceModal = true"
                class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#0A7380] hover:bg-[#085e68] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <app-icon name="check-circle" [size]="16"></app-icon>
                <span>Approve Attendance</span>
              </button>
            </div>
          </div>

          <!-- CARD: Payroll & Payment Status (Matches Mockup exact progress bar) -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-bold text-slate-900 tracking-tight">Payroll & Payment Status</h2>
              <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
                Cycle In-Flight
              </span>
            </div>

            <div class="text-xs font-medium text-slate-700 mb-2">
              {{ metrics().payrollMonth }}: Processing ({{ metrics().payrollProgressPercent }}%)
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                class="h-full bg-[#0A7380] rounded-full transition-all duration-500 ease-out"
                [style.width.%]="metrics().payrollProgressPercent"
              ></div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Disbursement Target: 31 Oct</span>
              <a routerLink="/payroll" class="text-teal-800 font-semibold hover:underline">View Payroll Sheet →</a>
            </div>
          </div>

          <!-- CARD: Plant Operations Status Note -->
          <div class="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
            <div class="flex items-center gap-2 font-semibold text-slate-800">
              <app-icon name="shield" [size]="15" customClass="text-teal-700"></app-icon>
              <span>Manufacturing Shift ISO-9001 Notice</span>
            </div>
            <p class="text-[11px] leading-relaxed text-slate-500">
              Automated audit trail active. All RFID and manual punch overrides are signed cryptographically with user identity token.
            </p>
          </div>

        </div>

      </div>

      <!-- Modals -->
      @if (showEmployeeModal) {
        <app-employee-modal (close)="showEmployeeModal = false"></app-employee-modal>
      }

      @if (showBroadcastModal) {
        <app-broadcast-modal (close)="showBroadcastModal = false"></app-broadcast-modal>
      }

      @if (showAttendanceModal) {
        <app-attendance-override-modal (close)="showAttendanceModal = false"></app-attendance-override-modal>
      }

      @if (showSettingsModal) {
        <app-settings-modal (close)="showSettingsModal = false"></app-settings-modal>
      }

    </div>
  `
})
export class DashboardComponent {
  supabaseService = inject(SupabaseService);

  metrics = this.supabaseService.metrics;
  attendanceLogs = this.supabaseService.attendanceLogs;
  leaveRequests = this.supabaseService.leaveRequests;

  showEmployeeModal = false;
  showBroadcastModal = false;
  showAttendanceModal = false;
  showSettingsModal = false;

  async onApproveLeave(leave: LeaveRequest) {
    await this.supabaseService.updateLeaveStatus(leave.id, 'approved');
  }

  async onRejectLeave(leave: LeaveRequest) {
    await this.supabaseService.updateLeaveStatus(leave.id, 'rejected');
  }

  onProcessPayroll() {
    this.supabaseService.processPayrollRun();
  }
}
