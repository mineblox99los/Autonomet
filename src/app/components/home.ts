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

      <h1 class="text-3xl sm:text-4xl font-medium text-center leading-tight tracking-tight max-w-[320px] sm:max-w-[800px] mb-4 text-white/95">
        Gemini 3 Flash Preview
      </h1>
      <p class="text-zinc-400 text-sm sm:text-base mb-2 text-center max-w-[280px] sm:max-w-[700px]">
        O melhor modelo do mundo para compreensão multimodal.
      </p>
      <p class="text-zinc-500 text-xs sm:text-sm mb-6 text-center max-w-[280px] sm:max-w-[600px] leading-relaxed">
        Nosso modelo mais poderoso para agentes e "vibe-coding" até agora, proporcionando visuais mais ricos e interatividade profunda, tudo construído sobre uma base de raciocínio de última geração.
      </p>

      <div class="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
        <a href="https://aistudio.google.com/prompts/new_chat?model=gemini-3-flash-preview" target="_blank" class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-xs font-medium no-underline">
          <mat-icon class="scale-75">open_in_new</mat-icon>
          Google AI Studio
        </a>
        <a href="https://ai.google.dev/gemini-api/docs/gemini-3" target="_blank" class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-xs font-medium no-underline">
          <mat-icon class="scale-75">description</mat-icon>
          Documentação Gemini 3
        </a>
      </div>
    </div>
  `
})
export class Home {}
