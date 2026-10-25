import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Plant Policies & Compliance SOPs</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manufacturing safety mandates, shift protocols, and regulatory compliance standards</p>
        </div>

        <span class="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-lg flex items-center gap-1.5">
          <app-icon name="shield" [size]="14"></app-icon>
          <span>ISO 45001 & OSHA Compliant</span>
        </span>
      </div>

      <!-- Policy Documents Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (sop of sops; track sop.id) {
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <app-icon name="file-text" [size]="20"></app-icon>
                </div>
                <span class="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                  {{ sop.code }}
                </span>
              </div>

              <div>
                <h3 class="font-bold text-slate-900 text-sm">{{ sop.title }}</h3>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ sop.description }}</p>
              </div>

              <div class="pt-2 flex flex-wrap gap-2">
                @for (tag of sop.tags; track tag) {
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    #{{ tag }}
                  </span>
                }
              </div>
            </div>

            <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-400">Updated: {{ sop.lastRevised }}</span>
              <button class="text-teal-800 font-semibold hover:text-teal-900 flex items-center gap-1">
                <span>View Standard</span>
                <app-icon name="arrow-up-right" [size]="13"></app-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class PoliciesComponent {
  sops = [
    {
      id: 'sop-1',
      code: 'AOP-SOP-014',
      title: 'Assembly Line Emergency E-Stop & Lockout/Tagout',
      description: 'Standard operational protocol for hazardous energy isolation before line servicing or mechanical clearing.',
      tags: ['Safety', 'Assembly', 'LOTO'],
      lastRevised: '15 Oct 2026'
    },
    {
      id: 'sop-2',
      code: 'AOP-SOP-029',
      title: 'Biometric & RFID Access Control Protocol',
      description: 'Guidelines governing plant floor entry verification, visitor badges, and secondary supervisor overrides.',
      tags: ['Security', 'Attendance', 'Compliance'],
      lastRevised: '02 Oct 2026'
    },
    {
      id: 'sop-3',
      code: 'AOP-SOP-041',
      title: 'Hazardous Materials & Warehouse Handling',
      description: 'Material Safety Data Sheet (MSDS) standards, spill kits, and required PPE for raw chemical loading docks.',
      tags: ['Warehouse', 'Chemicals', 'PPE'],
      lastRevised: '28 Sep 2026'
    },
    {
      id: 'sop-4',
      code: 'AOP-SOP-088',
      title: 'Night Shift Handover & Machine Health Logs',
      description: 'Detailed inspection routines required between 22:00 and 06:00 shift transitions for robotic arms.',
      tags: ['Maintenance', 'Night Shift', 'Quality'],
      lastRevised: '20 Oct 2026'
    }
  ];
}
