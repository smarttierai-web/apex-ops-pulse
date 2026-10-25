import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 transition-all duration-300 animate-in slide-in-from-right flex items-start gap-3.5 border-l-4"
          [class.border-l-emerald-500]="toast.type === 'success'"
          [class.border-l-rose-500]="toast.type === 'error'"
          [class.border-l-amber-500]="toast.type === 'warning'"
          [class.border-l-teal-600]="toast.type === 'info'"
        >
          <!-- Icon Badge -->
          <div
            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            [class.bg-emerald-50]="toast.type === 'success'"
            [class.text-emerald-600]="toast.type === 'success'"
            [class.bg-rose-50]="toast.type === 'error'"
            [class.text-rose-600]="toast.type === 'error'"
            [class.bg-amber-50]="toast.type === 'warning'"
            [class.text-amber-600]="toast.type === 'warning'"
            [class.bg-teal-50]="toast.type === 'info'"
            [class.text-teal-800]="toast.type === 'info'"
          >
            @if (toast.type === 'success') {
              <app-icon name="check-circle" [size]="18" customClass="text-emerald-600"></app-icon>
            } @else if (toast.type === 'error') {
              <app-icon name="alert-circle" [size]="18" customClass="text-rose-600"></app-icon>
            } @else if (toast.type === 'warning') {
              <app-icon name="alert-triangle" [size]="18" customClass="text-amber-600"></app-icon>
            } @else {
              <app-icon name="megaphone" [size]="18" customClass="text-teal-800"></app-icon>
            }
          </div>

          <!-- Content Body (Explicit High-Contrast Text Colors) -->
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-slate-900 tracking-tight leading-tight">
              {{ toast.title }}
            </h4>
            @if (toast.message) {
              <p class="text-xs text-slate-600 mt-1 leading-relaxed font-medium break-words">
                {{ toast.message }}
              </p>
            }
          </div>

          <!-- Close Button -->
          <button
            type="button"
            (click)="toastService.remove(toast.id)"
            class="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg shrink-0 cursor-pointer"
            title="Dismiss notification"
          >
            <app-icon name="x" [size]="14"></app-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
