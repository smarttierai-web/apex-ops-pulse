import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border transition-all duration-300 animate-in slide-in-from-right"
          [ngClass]="{
            'bg-slate-900 text-white border-slate-700': toast.type === 'info',
            'bg-emerald-900 text-white border-emerald-700': toast.type === 'success',
            'bg-rose-900 text-white border-rose-700': toast.type === 'error',
            'bg-amber-900 text-white border-amber-700': toast.type === 'warning'
          }"
        >
          <div class="mt-0.5 shrink-0">
            @if (toast.type === 'success') {
              <app-icon name="check-circle" [size]="18" customClass="text-emerald-400"></app-icon>
            } @else if (toast.type === 'error') {
              <app-icon name="alert-circle" [size]="18" customClass="text-rose-400"></app-icon>
            } @else if (toast.type === 'warning') {
              <app-icon name="alert-triangle" [size]="18" customClass="text-amber-400"></app-icon>
            } @else {
              <app-icon name="megaphone" [size]="18" customClass="text-teal-400"></app-icon>
            }
          </div>

          <div class="flex-1">
            <h4 class="text-sm font-semibold leading-tight">{{ toast.title }}</h4>
            @if (toast.message) {
              <p class="text-xs opacity-90 mt-1 leading-relaxed">{{ toast.message }}</p>
            }
          </div>

          <button
            type="button"
            (click)="toastService.remove(toast.id)"
            class="text-white/60 hover:text-white transition-colors"
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
