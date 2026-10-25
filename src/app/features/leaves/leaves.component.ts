import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { LeaveRequest, LeaveType } from '../../core/models/workforce.model';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Leave Approvals & Calendar</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manage annual leave, medical absences, and shift replacement approvals</p>
        </div>

        <button
          (click)="showCreateModal = true"
          class="px-4 py-2 bg-[#0A7380] hover:bg-[#085a64] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start"
        >
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Submit Leave Request</span>
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex items-center gap-2">
        <button
          type="button"
          (click)="selectedStatus = 'all'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          [ngClass]="selectedStatus === 'all' ? 'bg-[#1B2C4E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          All Requests ({{ allLeaves().length }})
        </button>
        <button
          type="button"
          (click)="selectedStatus = 'pending'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          [ngClass]="selectedStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'"
        >
          <span>Pending Approvals</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 font-bold">{{ pendingCount() }}</span>
        </button>
        <button
          type="button"
          (click)="selectedStatus = 'approved'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          [ngClass]="selectedStatus === 'approved' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'"
        >
          Approved
        </button>
        <button
          type="button"
          (click)="selectedStatus = 'rejected'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          [ngClass]="selectedStatus === 'rejected' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'"
        >
          Rejected
        </button>
      </div>

      <!-- Leave Requests List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (leave of filteredLeaves(); track leave.id) {
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <img
                    [src]="leave.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                    [alt]="leave.user_profile?.first_name || 'Staff'"
                    class="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <h3 class="font-bold text-slate-800 text-sm">
                      {{ leave.user_profile?.first_name }} {{ leave.user_profile?.last_name }}
                    </h3>
                    <div class="text-[11px] text-slate-400">
                      {{ leave.user_profile?.department }} • {{ leave.user_profile?.shift }}
                    </div>
                  </div>
                </div>

                <span
                  class="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md"
                  [ngClass]="{
                    'bg-amber-50 text-amber-700 border border-amber-200': leave.status === 'pending',
                    'bg-emerald-50 text-emerald-700 border border-emerald-200': leave.status === 'approved',
                    'bg-rose-50 text-rose-700 border border-rose-200': leave.status === 'rejected'
                  }"
                >
                  {{ leave.status }}
                </span>
              </div>

              <!-- Dates & Type -->
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div class="flex justify-between">
                  <span class="text-slate-400">Leave Category:</span>
                  <span class="font-semibold text-teal-800 uppercase text-[11px]">{{ leave.leave_type }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Duration Period:</span>
                  <span class="font-medium text-slate-700">{{ leave.start_date }} to {{ leave.end_date }}</span>
                </div>
                <div class="pt-1 text-slate-600 italic">
                  "{{ leave.reason }}"
                </div>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[11px] text-slate-400">Supervisory Action</span>
              @if (leave.status === 'pending') {
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="approve(leave.id)"
                    class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <app-icon name="check" [size]="13"></app-icon>
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    (click)="reject(leave.id)"
                    class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <app-icon name="x" [size]="13"></app-icon>
                    <span>Reject</span>
                  </button>
                </div>
              } @else {
                <span class="text-xs font-semibold text-slate-500">
                  Decision finalized: {{ leave.status | uppercase }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Request Leave Modal -->
      @if (showCreateModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b">
              <h3 class="font-bold text-slate-800 text-base">Request Shift Absence</h3>
              <button (click)="showCreateModal = false" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Leave Category</label>
                <select
                  [(ngModel)]="newLeaveType"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Medical / Sick Leave</option>
                  <option value="casual">Casual Emergency</option>
                  <option value="shift_swap">Shift Swap Request</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    [(ngModel)]="newStartDate"
                    class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    [(ngModel)]="newEndDate"
                    class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Reason / Shift Coverage Notes</label>
                <textarea
                  [(ngModel)]="newReason"
                  rows="3"
                  placeholder="Detail rationale for supervisor review..."
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                (click)="showCreateModal = false"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submitNewLeave()"
                class="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class LeavesComponent {
  private supabaseService = inject(SupabaseService);

  allLeaves = this.supabaseService.leaveRequests;
  selectedStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

  showCreateModal = false;
  newLeaveType: LeaveType = 'annual';
  newStartDate = '2026-11-01';
  newEndDate = '2026-11-05';
  newReason = 'Annual personal rest and scheduled travel';

  pendingCount = computed(() => this.allLeaves().filter(l => l.status === 'pending').length);

  filteredLeaves = computed(() => {
    const list = this.allLeaves();
    if (this.selectedStatus === 'all') return list;
    return list.filter(l => l.status === this.selectedStatus);
  });

  async approve(id: string) {
    await this.supabaseService.updateLeaveStatus(id, 'approved');
  }

  async reject(id: string) {
    await this.supabaseService.updateLeaveStatus(id, 'rejected');
  }

  submitNewLeave() {
    const user = this.supabaseService.currentUser();
    const newRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      user_id: user?.id || '00000000-0000-0000-0000-000000000002',
      leave_type: this.newLeaveType,
      start_date: this.newStartDate,
      end_date: this.newEndDate,
      reason: this.newReason,
      status: 'pending',
      created_at: new Date().toISOString(),
      user_profile: user || undefined
    };

    this.supabaseService.leaveRequests.update(leaves => [newRequest, ...leaves]);
    this.supabaseService.metrics.update(m => ({
      ...m,
      pendingLeaveRequestsCount: m.pendingLeaveRequestsCount + 1,
      pendingActionsTotal: m.pendingActionsTotal + 1,
      pendingLeaves: m.pendingLeaves + 1
    }));

    this.showCreateModal = false;
  }
}
