import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-broadcast-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div class="px-6 py-4 bg-[#1B2C4E] text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <app-icon name="megaphone" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-semibold leading-none">Broadcast Announcement</h3>
              <p class="text-xs text-slate-300 mt-1">Alert all shift lines, supervisors, and floor displays</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-1">
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Target Department / Floor</label>
            <select
              [(ngModel)]="department"
              class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="All Departments">All Departments (Plant-Wide)</option>
              <option value="Assembly">Assembly Floor Lines</option>
              <option value="Quality Control">Quality Control Lab</option>
              <option value="Warehouse & Supply">Warehouse & Logistics</option>
              <option value="Plant Maintenance">Plant Maintenance Crews</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Subject / Header *</label>
            <input
              type="text"
              [(ngModel)]="title"
              placeholder="e.g. Scheduled Power Audit - Line 3"
              class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Announcement Message *</label>
            <textarea
              [(ngModel)]="message"
              rows="4"
              placeholder="Enter message for line displays and operator handheld devices..."
              class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            ></textarea>
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
              (click)="sendBroadcast()"
              [disabled]="!title || !message"
              class="px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <app-icon name="megaphone" [size]="14"></app-icon>
              <span>Transmit Announcement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BroadcastModalComponent {
  @Output() close = new EventEmitter<void>();

  private supabaseService = inject(SupabaseService);

  department = 'All Departments';
  title = 'Q4 Shift Handover & Safety Protocols';
  message = 'All team leads must verify line PPE and biometric logouts before 14:00.';

  sendBroadcast() {
    this.supabaseService.broadcastAnnouncement(
      `[${this.department}] ${this.title}`,
      this.message
    );
    this.close.emit();
  }
}
