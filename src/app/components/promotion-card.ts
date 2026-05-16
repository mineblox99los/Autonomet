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
      class="mx-3 my-4 p-4 rounded-xl bg-white/3 border border-white/5 flex flex-col items-center justify-center min-h-[100px] group transition-all hover:bg-white/5"
    >
      <div class="flex flex-col items-center gap-2 text-zinc-500">
        <mat-icon class="scale-90 opacity-40">ad_units</mat-icon>
        <span class="text-[10px] font-bold tracking-widest uppercase opacity-40">anúncio em breve</span>
      </div>
    </div>
  `
})
export class PromotionCard {
  // Keeping inputs as optional to avoid breaking existing users if they are not updated simultaneously
  title = input<string | undefined>();
  description = input<string | undefined>();
  icon = input<string | undefined>();
  buttonText = input<string | undefined>();
  adId = input<string | undefined>();

  handleAdClick() {
    // No-op for now
  }
}
