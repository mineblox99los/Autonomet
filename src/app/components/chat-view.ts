import { ChangeDetectionStrategy, Component, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { GeminiService } from '../services/gemini';
import { Home } from './home';
import { ChatHistory } from './chat-history';
import { ChatInput } from './chat-input';
import { ApiKeyModal } from './api-key-modal';
import { Sidebar } from './sidebar';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RouterLink, Home, ChatHistory, ChatInput, ApiKeyModal, Sidebar],
  template: `
    <div class="flex flex-col h-[100dvh] bg-gemini-bg font-sans overflow-hidden">
      <!-- Header -->
      <header class="flex items-center justify-between px-4 py-2 border-b border-gemini-border shrink-0 bg-gemini-bg z-20">
        <div class="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button 
              (click)="toggleSidebar()"
              class="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 active:bg-blue-500/20 active:ring-1 active:ring-blue-500/40 transition-all font-medium"
              id="sidebar-toggle-btn"
            >
              <mat-icon>{{ isSidebarOpen() ? 'close' : 'menu' }}</mat-icon>
            </button>
            
            <div class="h-6 w-px bg-gemini-border mx-1"></div>

            <div class="flex items-center gap-2">
              <!-- Settings Dropdown Trigger -->
              <div class="relative header-dropdown-container">
                <button 
                  (click)="isSettingsMenuOpen.set(!isSettingsMenuOpen())"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
                  aria-label="Configurações de API"
                >
                  <mat-icon class="!text-[20px]">settings</mat-icon>
                  <span class="text-xs font-medium hidden sm:inline">Ajustes</span>
                </button>

                @if (isSettingsMenuOpen()) {
                  <div class="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Configurações de API</div>
                    
                    <div class="bg-black/20 rounded-lg px-3 py-2.5 mb-3 border border-white/5">
                      <code class="text-[10px] text-zinc-400 truncate leading-none block">
                        {{ maskedKey() }}
                      </code>
                    </div>

                    <button 
                      (click)="openApiKeyModal()"
                      class="w-full text-left text-xs px-2 py-1.5 rounded-lg text-blue-400 hover:bg-blue-400/5 active:bg-blue-400/10 transition-colors font-medium flex items-center gap-2"
                    >
                      <mat-icon class="!text-[16px]">key</mat-icon>
                      Gerenciar Chave
                    </button>
                  </div>
                }
              </div>

              <!-- Model Selector (to the right of settings) -->
              <div class="relative model-dropdown-container">
                <div class="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                     (click)="isModelMenuOpen.set(!isModelMenuOpen())"
                     (keydown.enter)="isModelMenuOpen.set(!isModelMenuOpen())"
                     tabindex="0"
                     role="button"
                     aria-label="Selecionar modelo">
                  <span class="text-sm font-medium text-zinc-200">
                    {{ getModelName(gemini.getSelectedModel()) }}
                  </span>
                  <mat-icon class="!text-[18px] text-zinc-500 group-hover:text-zinc-300 transition-colors">keyboard_arrow_down</mat-icon>
                </div>
                
                @if (isModelMenuOpen()) {
                  <div class="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-[100]">
                    <div class="p-2 space-y-1">
                      @for (model of gemini.availableModels; track model.id) {
                        <button 
                          (click)="selectModel(model.id, $event)"
                          class="w-full text-left px-3 py-2.5 rounded-lg transition-all flex flex-col gap-0.5"
                          [class]="gemini.getSelectedModel() === model.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'"
                        >
                          <div class="flex items-center justify-between w-full">
                            <span class="text-sm font-medium" [class.text-blue-400]="gemini.getSelectedModel() === model.id" [class.text-zinc-200]="gemini.getSelectedModel() !== model.id">
                              {{ model.name }}
                            </span>
                            @if (gemini.getSelectedModel() === model.id) {
                              <mat-icon class="!text-[18px] text-blue-400">check</mat-icon>
                            }
                          </div>
                          <span class="text-[10px] text-zinc-500">{{ model.description }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            @if (gemini.chatHistory().length > 0) {
              <span class="text-sm font-medium text-zinc-300 animate-in fade-in duration-300">Superintelligence</span>
            }
          </div>
        </div>
      </header>

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
            [status]="gemini.workingStatus()">
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
              (send)="sendMessage($event)">
            </app-chat-input>
            
            <div class="flex flex-col items-center gap-1 mt-3 px-4">
              <div class="text-[10px] text-zinc-500 text-center">
                A IA pode apresentar informações imprecisas, inclusive sobre pessoas, por isso verifique as respostas.
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
  isSidebarOpen = signal(false);
  isModelMenuOpen = signal(false);
  isSettingsMenuOpen = signal(false);

  maskedKey = computed(() => {
    const key = this.gemini.getApiKey();
    if (!key) return 'Chave padrão ativada';
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  });

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isModelMenuOpen() && !target.closest('.model-dropdown-container')) {
      this.isModelMenuOpen.set(false);
    }
    if (this.isSettingsMenuOpen() && !target.closest('.header-dropdown-container')) {
      this.isSettingsMenuOpen.set(false);
    }
  }

  getModelName(id: string) {
    return this.gemini.availableModels.find(m => m.id === id)?.name || id;
  }

  selectModel(id: string, event: Event) {
    event.stopPropagation();
    this.gemini.setSelectedModel(id);
    this.isModelMenuOpen.set(false);
  }

  openApiKeyModal() {
    this.isSettingsMenuOpen.set(false);
    this.isApiKeyModalOpen.set(true);
  }

  sendMessage(prompt: string) {
    this.gemini.sendMessage(prompt);
  }

  saveApiKey(key: string) {
    this.gemini.setApiKey(key);
    this.isApiKeyModalOpen.set(false);
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
