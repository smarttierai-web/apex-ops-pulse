import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { PerformanceReview } from '../../core/models/workforce.model';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Workforce Performance & Reviews</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manufacturing line efficiency, Six Sigma quality pass rates, and operator appraisals</p>
        </div>

        <button
          (click)="showReviewModal = true"
          class="px-4 py-2 bg-[#0A7380] hover:bg-[#085a64] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start"
        >
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Conduct Shift Appraisal</span>
        </button>
      </div>

      <!-- Factory Floor KPI Overview Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Line Efficiency</span>
            <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
              <app-icon name="trending-up" [size]="16"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">96.8%</div>
          <div class="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <app-icon name="check" [size]="13"></app-icon>
            <span>+1.8% vs. Q2 Benchmark</span>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Quality Pass Rate</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <app-icon name="check-circle" [size]="16"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">99.2%</div>
          <div class="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <app-icon name="check" [size]="13"></app-icon>
            <span>Six Sigma Tolerances Met</span>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Zero-Incident Streak</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <app-icon name="shield" [size]="16"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">142 Days</div>
          <div class="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <app-icon name="check" [size]="13"></app-icon>
            <span>100% Floor Safety Adherence</span>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Shift Handover</span>
            <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <app-icon name="clock" [size]="16"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">98.5%</div>
          <div class="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>Avg Handover: 4.2 mins</span>
          </div>
        </div>

      </div>

      <!-- Filters & Period Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="selectedPeriod = 'All'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            [ngClass]="selectedPeriod === 'All' ? 'bg-[#1B2C4E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            All Cycles
          </button>
          <button
            type="button"
            (click)="selectedPeriod = 'Q3 2026'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            [ngClass]="selectedPeriod === 'Q3 2026' ? 'bg-[#0A7380] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Q3 2026 Active
          </button>
        </div>

        <div class="text-xs text-slate-400 font-medium">
          Showing {{ filteredReviews().length }} comprehensive worker appraisals
        </div>
      </div>

      <!-- Performance Appraisals Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (rev of filteredReviews(); track rev.id) {
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 flex flex-col justify-between hover:border-teal-500/50 transition-all">
            <div class="space-y-4">
              
              <!-- Worker Profile & Grade -->
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <img
                    [src]="rev.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'"
                    [alt]="rev.user_profile?.first_name"
                    class="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h3 class="font-bold text-slate-900 text-sm">
                      {{ rev.user_profile?.first_name }} {{ rev.user_profile?.last_name }}
                    </h3>
                    <div class="text-[11px] font-mono text-teal-800 font-semibold">{{ rev.user_profile?.employee_id }}</div>
                    <div class="text-[10px] text-slate-400">{{ rev.user_profile?.department }} • {{ rev.user_profile?.shift }}</div>
                  </div>
                </div>

                <div class="text-right">
                  <span
                    class="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase shadow-xs inline-block"
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-800 border border-emerald-300': rev.grade === 'A+' || rev.grade === 'A',
                      'bg-teal-100 text-teal-800 border border-teal-300': rev.grade === 'B+',
                      'bg-slate-100 text-slate-700': rev.grade === 'B'
                    }"
                  >
                    Grade {{ rev.grade }}
                  </span>
                  <div class="text-[11px] font-bold text-slate-700 mt-1">{{ rev.overall_score }} / 5.0</div>
                </div>
              </div>

              <!-- Performance Sliders / Bars -->
              <div class="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <div class="flex justify-between text-[11px] mb-1">
                    <span class="text-slate-500">Hourly Output Efficiency</span>
                    <span class="font-bold text-slate-800">{{ rev.efficiency_rating }}%</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-teal-700 rounded-full" [style.width.%]="rev.efficiency_rating"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-[11px] mb-1">
                    <span class="text-slate-500">Six Sigma Quality Accuracy</span>
                    <span class="font-bold text-slate-800">{{ rev.quality_accuracy }}%</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-600 rounded-full" [style.width.%]="rev.quality_accuracy"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-[11px] mb-1">
                    <span class="text-slate-500">Safety & Floor Adherence</span>
                    <span class="font-bold text-emerald-700">{{ rev.safety_score }}%</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="rev.safety_score"></div>
                  </div>
                </div>
              </div>

              <!-- Comments -->
              <div class="text-xs text-slate-600 italic bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 leading-relaxed">
                "{{ rev.comments }}"
              </div>

              <!-- Goals -->
              <div class="space-y-1">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quarterly Target Goals</span>
                <ul class="text-xs text-slate-700 space-y-1">
                  @for (goal of rev.goals; track goal) {
                    <li class="flex items-center gap-1.5">
                      <app-icon name="check" [size]="12" customClass="text-teal-700 shrink-0"></app-icon>
                      <span>{{ goal }}</span>
                    </li>
                  }
                </ul>
              </div>

            </div>

            <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-[11px] text-slate-400">Evaluated by: {{ rev.reviewer_name }}</span>
              <button
                type="button"
                (click)="selectedReview = rev"
                class="text-xs font-semibold text-teal-800 hover:text-teal-900"
              >
                View Full Scorecard →
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Full Scorecard Modal -->
      @if (selectedReview) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                  <app-icon name="trending-up" [size]="18"></app-icon>
                </div>
                <h3 class="font-bold text-slate-900 text-base">Comprehensive Performance Scorecard</h3>
              </div>
              <button (click)="selectedReview = null" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            </div>

            <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <img [src]="selectedReview.user_profile?.avatar_url" class="w-14 h-14 rounded-xl object-cover ring-2 ring-teal-600" />
              <div>
                <h4 class="font-bold text-slate-900 text-base">
                  {{ selectedReview.user_profile?.first_name }} {{ selectedReview.user_profile?.last_name }}
                </h4>
                <div class="text-xs font-mono text-teal-800 font-semibold">{{ selectedReview.user_profile?.employee_id }}</div>
                <div class="text-xs text-slate-500 uppercase">{{ selectedReview.user_profile?.department }} • {{ selectedReview.review_period }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900">
                <span class="text-[10px] uppercase font-bold text-teal-700">Efficiency</span>
                <div class="text-xl font-bold">{{ selectedReview.efficiency_rating }}%</div>
              </div>
              <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <span class="text-[10px] uppercase font-bold text-emerald-700">Safety Score</span>
                <div class="text-xl font-bold">{{ selectedReview.safety_score }}%</div>
              </div>
            </div>

            <div class="text-xs space-y-2">
              <div class="font-bold text-slate-800">Formal Shift Feedback:</div>
              <p class="text-slate-600 bg-slate-50 p-3 rounded-xl border leading-relaxed">
                {{ selectedReview.comments }}
              </p>
            </div>

            <div class="flex justify-end pt-2">
              <button (click)="selectedReview = null" class="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold">
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Conduct Shift Appraisal Modal -->
      @if (showReviewModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b">
              <h3 class="font-bold text-slate-900 text-base">New Shift Performance Appraisal</h3>
              <button (click)="showReviewModal = false" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Select Employee</label>
                <select
                  [(ngModel)]="newReviewEmpId"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  @for (emp of supabaseService.workforce(); track emp.id) {
                    <option [value]="emp.id">{{ emp.first_name }} {{ emp.last_name }} ({{ emp.employee_id }}) - {{ emp.department }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Efficiency Rating (%)</label>
                  <input
                    type="number"
                    [(ngModel)]="newEfficiency"
                    class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Quality Pass Rate (%)</label>
                  <input
                    type="number"
                    [(ngModel)]="newQuality"
                    class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Supervisory Notes & Floor Observations</label>
                <textarea
                  [(ngModel)]="newComments"
                  rows="3"
                  placeholder="Detail operator performance, safety compliance, and line output..."
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                (click)="showReviewModal = false"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submitAppraisal()"
                class="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg"
              >
                Save Appraisal
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class PerformanceComponent {
  supabaseService = inject(SupabaseService);

  reviews = this.supabaseService.performanceReviews;
  selectedPeriod = 'All';

  selectedReview: PerformanceReview | null = null;
  showReviewModal = false;

  newReviewEmpId = '00000000-0000-0000-0000-000000000002';
  newEfficiency = 97.5;
  newQuality = 99.1;
  newComments = 'Outstanding line velocity and tool discipline throughout the week.';

  filteredReviews = computed(() => {
    const list = this.reviews();
    if (this.selectedPeriod === 'All') return list;
    return list.filter(r => r.review_period === this.selectedPeriod);
  });

  submitAppraisal() {
    const targetEmp = this.supabaseService.workforce().find(w => w.id === this.newReviewEmpId);
    const newRev: PerformanceReview = {
      id: `rev-${Date.now()}`,
      user_id: this.newReviewEmpId,
      reviewer_name: 'Admin User (HR Manager)',
      review_period: 'Q3 2026',
      efficiency_rating: this.newEfficiency,
      safety_score: 100,
      quality_accuracy: this.newQuality,
      overall_score: 4.8,
      grade: 'A',
      comments: this.newComments,
      goals: ['Complete Advanced Ergonomics Module', 'Exceed line takt-time targets'],
      reviewed_at: new Date().toISOString(),
      user_profile: targetEmp
    };

    this.supabaseService.performanceReviews.update(list => [newRev, ...list]);
    this.showReviewModal = false;
  }
}
