import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../services/gemini';

@Component({
  selector: 'app-usage-monitor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gemini 3.0 Flash</span>
        </div>
      </div>

      <div class="space-y-4">
        <!-- RPM -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-zinc-500">RPM (Requisições / min)</span>
            <span [class]="rpmColor()">{{ quota().rpm }} / {{ quota().maxRpm }}</span>
          </div>
          <div class="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-500"
              [class]="rpmBg()"
              [style.width.%]="rpmPercent()">
            </div>
          </div>
        </div>

        <!-- TPM -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-zinc-500">TPM (Tokens / min)</span>
            <span [class]="tpmColor()">{{ formatValue(quota().tpm) }} / {{ formatValue(quota().maxTpm) }}</span>
          </div>
          <div class="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-500"
              [class]="tpmBg()"
              [style.width.%]="tpmPercent()">
            </div>
          </div>
        </div>

        <!-- RPD -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-zinc-500">RPD (Requisições / dia)</span>
            <span [class]="rpdColor()">{{ quota().rpd }} / {{ quota().maxRpd }}</span>
          </div>
          <div class="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-500"
              [class]="rpdBg()"
              [style.width.%]="rpdPercent()">
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-white/5 flex items-start gap-2">
        <p class="text-[9px] text-zinc-600 leading-tight">
          Estimativas calculadas localmente. Limites baseados no nível gratuito (Spark) do Gemini 3.0 Flash.
        </p>
      </div>
    </div>
  `
})
export class UsageMonitor {
  private gemini = inject(GeminiService);
  quota = this.gemini.quota;

  rpmPercent = computed(() => Math.min(100, (this.quota().rpm / this.quota().maxRpm) * 100));
  tpmPercent = computed(() => Math.min(100, (this.quota().tpm / this.quota().maxTpm) * 100));
  rpdPercent = computed(() => Math.min(100, (this.quota().rpd / this.quota().maxRpd) * 100));

  rpmColor = computed(() => this.getColorClass(this.rpmPercent()));
  tpmColor = computed(() => this.getColorClass(this.tpmPercent()));
  rpdColor = computed(() => this.getColorClass(this.rpdPercent()));

  rpmBg = computed(() => this.getBgClass(this.rpmPercent()));
  tpmBg = computed(() => this.getBgClass(this.tpmPercent()));
  rpdBg = computed(() => this.getBgClass(this.rpdPercent()));

  formatValue(val: number): string {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  }

  private getColorClass(percent: number): string {
    if (percent > 90) return 'text-red-400 font-bold';
    if (percent > 70) return 'text-orange-400 font-medium';
    return 'text-zinc-300';
  }

  private getBgClass(percent: number): string {
    if (percent > 90) return 'bg-red-500';
    if (percent > 70) return 'bg-orange-500';
    return 'bg-emerald-500';
  }
}
