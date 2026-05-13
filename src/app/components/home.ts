import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="mb-6" id="gemini-star-container">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white">
          <path d="M12 0C12 7.127 16.873 12 24 12C16.873 12 12 16.873 12 24C12 16.873 7.127 12 0 12C7.127 12 12 7.127 12 0Z" fill="currentColor" />
        </svg>
      </div>

      <h1 class="text-3xl sm:text-4xl font-medium text-center leading-tight tracking-tight max-w-[320px] sm:max-w-[600px] mb-4 text-white/95">
        Crie suas ideias com o Gemini
      </h1>
      <p class="text-zinc-400 text-sm sm:text-base mb-10 text-center max-w-[280px] sm:max-w-none">Onde a sua criatividade encontra a inteligência artificial</p>
    </div>
  `
})
export class Home {}
