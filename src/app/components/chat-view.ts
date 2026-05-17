import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { GeminiService } from '../services/gemini';
import { Home } from './home';
import { ChatHistory } from './chat-history';
import { ChatInput } from './chat-input';
import { ApiKeyModal } from './api-key-modal';
import { Sidebar } from './sidebar';
import { SystemInstructionModal } from './system-instruction-modal';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RouterLink, Home, ChatHistory, ChatInput, ApiKeyModal, Sidebar, SystemInstructionModal],
  template: `
    <div class="flex flex-col h-[100dvh] bg-gemini-bg font-sans overflow-hidden">
      <!-- Header -->
      @if (!gemini.viewingImage()) {
        <header class="flex items-center justify-between px-4 py-2 border-b border-gemini-border shrink-0 bg-gemini-bg z-20 animate-in fade-in duration-300">
          <div class="max-w-[1200px] mx-auto w-full flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button 
                (click)="toggleSidebar()"
                class="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 active:bg-blue-500/20 active:ring-1 active:ring-blue-500/40 transition-all font-medium"
                id="sidebar-toggle-btn"
              >
                <mat-icon>{{ isSidebarOpen() ? 'close' : 'menu' }}</mat-icon>
              </button>
              
              <div class="flex items-center gap-2">
                @if (gemini.chatHistory().length > 0) {
                  <span class="text-sm font-medium text-zinc-300 animate-in fade-in duration-300">Superintelligence</span>
                }
              </div>
            </div>
  
            <div class="flex items-center gap-2">
            </div>
          </div>
        </header>
      }

      <!-- Sidebar -->
      @if (isSidebarOpen()) {
        <app-sidebar
          [sessions]="gemini.chatSessions()"
          [activeSessionId]="gemini.getActiveSessionId()"
          (closeSidebar)="isSidebarOpen.set(false)"
          (newChat)="createNewChat()"
          (selectSession)="loadSession($event)"
          (deleteSession)="deleteSession($event)"
        ></app-sidebar>
      }

      <main class="flex-1 flex flex-col w-full relative overflow-hidden">
        
        @if (gemini.chatHistory().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center pb-24 sm:pb-32 max-w-[900px] mx-auto w-full">
            <app-home 
              class="flex flex-col items-center justify-center">
            </app-home>
          </div>
        } @else {
          <app-chat-history 
            class="flex-1 min-h-0 w-full"
            [history]="gemini.chatHistory()" 
            [isLoading]="gemini.isLoading()"
            [elapsedTime]="gemini.elapsedTime()"
            [status]="gemini.workingStatus()"
            (openSettings)="isApiKeyModalOpen.set(true)">
          </app-chat-history>
        }

        <!-- Bottom fixed input area -->
        <div class="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-16 bg-gradient-to-t from-gemini-bg via-gemini-bg/95 to-transparent z-10 pointer-events-none">
          <div class="max-w-3xl mx-auto w-full pointer-events-auto">
            <app-chat-input 
              [isLoading]="gemini.isLoading()" 
              [hasCustomKey]="gemini.hasCustomKey()"
              [currentKey]="gemini.getApiKey()"
              (openApiKeyModal)="isApiKeyModalOpen.set(true)"
              (openSystemInstructionModal)="isSystemInstructionModalOpen.set(true)"
              (send)="sendMessage($event)">
            </app-chat-input>
            
            <div class="flex flex-col items-center gap-1 mt-3 px-4">
              <div class="text-[10px] text-zinc-500 text-center">
                A IA pode apresentar informações imprecisas, inclusive sobre pessoas, por isso verifique as respostas. Utiliza o Gemini 3.0 Flash. Dados até Janeiro de 2025.
              </div>
              <div class="flex items-center gap-3 text-[10px] font-medium">
                <a routerLink="/privacy" class="text-zinc-600 hover:text-blue-400 underline transition-colors">Privacidade</a>
                <span class="w-1 h-1 rounded-full bg-zinc-800"></span>
                <a routerLink="/terms" class="text-zinc-600 hover:text-blue-400 underline transition-colors">Termos de Uso</a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Modals -->
      @if (isApiKeyModalOpen()) {
        <app-api-key-modal
          [currentKey]="gemini.getApiKey()"
          (saveKey)="saveApiKey($event)"
          (clearKey)="clearApiKey()"
          (closeModal)="isApiKeyModalOpen.set(false)"
        ></app-api-key-modal>
      }

      @if (isSystemInstructionModalOpen()) {
        <app-system-instruction-modal
          [currentInstruction]="gemini.systemInstruction()"
          (save)="saveSystemInstruction($event)"
          (closeModal)="isSystemInstructionModalOpen.set(false)"
        ></app-system-instruction-modal>
      }

      <!-- Image Viewer Overlay -->
      @if (gemini.viewingImage(); as imageUrl) {
        <div 
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-300 backdrop-blur-sm cursor-zoom-out"
          role="button"
          tabindex="0"
          (click)="gemini.viewingImage.set(null)"
          (keydown.enter)="gemini.viewingImage.set(null)"
          (keydown.space)="gemini.viewingImage.set(null)"
          aria-label="Fechar visualização"
        >
          <button 
            (click)="gemini.viewingImage.set(null)"
            class="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
            aria-label="Fechar"
          >
            <mat-icon>close</mat-icon>
          </button>
          
          <img 
            [src]="imageUrl" 
            alt="Visualização da imagem ampliada"
            class="max-w-full max-h-full object-contain p-4 animate-in zoom-in duration-300 select-none shadow-2xl"
            (click)="$event.stopPropagation()"
            role="presentation"
          >
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    textarea {
      min-height: 48px;
      max-height: 200px;
      line-height: 1.4;
      color: white;
    }
    textarea:focus {
      outline: none;
    }
    .markdown-content p:first-child { margin-top: 0; }
    .markdown-content p:last-child { margin-bottom: 0; }
    .markdown-content ul, .markdown-content ol {
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    #gemini-star-container svg path {
      transform: scale(0.9);
      transform-origin: center;
    }
  `]
})
export class ChatView {
  gemini = inject(GeminiService);
  isApiKeyModalOpen = signal(false);
  isSystemInstructionModalOpen = signal(false);
  isSidebarOpen = signal(false);

  sendMessage(event: { prompt: string, images?: { data: string, mimeType: string }[] }) {
    this.gemini.sendMessage(event.prompt, event.images);
  }

  saveApiKey(key: string) {
    this.gemini.setApiKey(key);
    this.isApiKeyModalOpen.set(false);
  }

  saveSystemInstruction(instruction: string) {
    this.gemini.setSystemInstruction(instruction);
    this.isSystemInstructionModalOpen.set(false);
  }

  clearApiKey() {
    localStorage.removeItem('user_gemini_api_key');
    window.location.reload();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  createNewChat() {
    this.gemini.createNewSession();
    this.isSidebarOpen.set(false);
  }

  loadSession(id: string) {
    this.gemini.loadSession(id);
    this.isSidebarOpen.set(false);
  }

  deleteSession(id: string) {
    this.gemini.deleteSession(id);
  }
}
