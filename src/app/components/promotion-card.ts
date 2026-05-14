import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-promotion-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="mx-3 my-4 p-3 rounded-xl bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border border-zinc-800 shadow-lg relative overflow-hidden group cursor-pointer transition-all hover:border-zinc-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      (click)="handleAdClick()"
      (keydown.enter)="handleAdClick()"
      (keydown.space)="handleAdClick()"
      role="button"
      tabindex="0"
    >
      <!-- Glossy effect -->
      <div class="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <!-- Label -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/30 border border-zinc-800">Patrocinado</span>
        <mat-icon class="text-zinc-600 scale-[0.5] group-hover:text-zinc-400">info_outline</mat-icon>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <mat-icon class="text-indigo-400 scale-90">{{ icon() }}</mat-icon>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-[13px] font-semibold text-zinc-100 leading-tight truncate">{{ title() }}</h4>
            <p class="text-[11px] text-zinc-400 leading-snug line-clamp-2 mt-0.5">{{ description() }}</p>
          </div>
        </div>
        
        <button class="w-full py-1.5 mt-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20">
          {{ buttonText() }}
        </button>
      </div>

      <!-- Views tracker (simulated) -->
      <div class="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity">
        <mat-icon class="scale-[3] text-white">trending_up</mat-icon>
      </div>
    </div>
  `
})
export class PromotionCard {
  title = input<string>('Melhore sua Produtividade');
  description = input<string>('Conheça as melhores ferramentas de IA para seu dia a dia.');
  icon = input<string>('auto_awesome');
  buttonText = input<string>('Saber mais');
  adId = input<string>('default-ad');

  handleAdClick() {
    // In a real app, logic for tracking clicks would go here
    console.log('Ad Clicked:', this.adId());
    window.open('https://google.com', '_blank');
  }
}
