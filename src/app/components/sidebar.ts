import { Component, ChangeDetectionStrategy, output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChatSession } from '../services/gemini';
import { PromotionCard } from './promotion-card';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, PromotionCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Overlay for mobile -->
    <div 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] lg:hidden animate-in fade-in duration-300"
      (click)="closeSidebar.emit()"
      role="presentation"
    ></div>

    <!-- Sidebar content -->
    <aside 
      class="fixed inset-y-0 left-0 w-[240px] bg-gemini-surface border-r border-gemini-border z-[90] flex flex-col pt-4 overflow-hidden animate-in slide-in-from-left duration-300 ease-out shadow-2xl"
      role="navigation"
    >
      <!-- New Chat Button -->
      <div class="px-4 mb-6">
        <button 
          (click)="handleNewChat()"
          class="w-full h-11 flex items-center gap-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:bg-blue-500/20 active:border-blue-500/40 transition-all group"
          title="Novo Chat"
        >
          <mat-icon class="scale-90 text-blue-400">add</mat-icon>
          <span class="text-sm font-medium">Novo Chat</span>
        </button>
      </div>

      <!-- History Label -->
      <div class="px-6 mb-3">
        <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Histórico</span>
      </div>

      <!-- Session List -->
      <div class="flex-1 overflow-y-auto px-3 pb-4 scrollbar-none space-y-1">
        @if (sessions().length === 0) {
          <div class="px-3 py-10 flex flex-col items-center justify-center text-center">
            <mat-icon class="text-zinc-700 scale-150 mb-3">history</mat-icon>
            <p class="text-xs text-zinc-500 max-w-[140px]">Suas conversas aparecerão aqui</p>
          </div>
        } @else {
          @for (session of sessions(); track session.id) {
            <button 
              type="button"
              class="group w-full flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 active:bg-blue-500/20 active:ring-1 active:ring-blue-500/30 outline-none focus:bg-white/5"
              [class.bg-white/5]="activeSessionId() === session.id"
              (click)="selectSession.emit(session.id)"
            >
              <mat-icon class="text-zinc-500 scale-75 group-hover:text-zinc-300">chat_bubble_outline</mat-icon>
              <div class="flex-1 min-w-0 text-left">
                <span class="text-[13px] text-zinc-400 group-hover:text-zinc-100 truncate block">
                  {{ session.title }}
                </span>
              </div>
              <button 
                type="button"
                (click)="handleDelete(session.id, $event)"
                class="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/30 rounded-lg transition-all"
                title="Excluir"
              >
                <mat-icon class="scale-75">delete_outline</mat-icon>
              </button>
            </button>
          }
        }
      </div>

      <!-- Advertisement / Promotions -->
      <app-promotion-card></app-promotion-card>

      <!-- Bottom Profile/Status (Optional) -->
      <div class="p-4 border-t border-gemini-border mt-auto relative">
        <!-- Dropdown Menu -->
        @if (isProfileMenuOpen()) {
          <div 
            class="absolute bottom-[75px] left-4 right-4 bg-gemini-surface border border-gemini-border rounded-xl shadow-2xl py-3 px-4 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200 z-[105]"
          >
            <span class="text-[13px] font-medium text-zinc-300">Em desenvolvimento</span>
          </div>
          <!-- Backdrop to close dropdown -->
          <div 
            class="fixed inset-0 z-[100]" 
            (click)="isProfileMenuOpen.set(false)"
            role="presentation"
          ></div>
        }

        <div 
          (click)="isProfileMenuOpen.set(!isProfileMenuOpen())"
          (keydown.enter)="isProfileMenuOpen.set(!isProfileMenuOpen())"
          tabindex="0"
          role="button"
          aria-label="Menu do usuário"
          class="flex items-center gap-3 px-2 py-2 rounded-xl transition-all cursor-pointer group relative z-[105] focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:bg-blue-500/20"
          [class.bg-white/10]="isProfileMenuOpen()"
          [class.hover:bg-white/5]="!isProfileMenuOpen()"
        >
          <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <mat-icon class="text-[16px] text-blue-400">person</mat-icon>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <div class="text-[12px] font-medium text-zinc-200 truncate">Usuário</div>
            <div class="text-[10px] text-zinc-500 truncate">Conta Pessoal</div>
          </div>
          <mat-icon class="text-zinc-600 scale-75 group-hover:text-zinc-400 transition-colors">unfold_more</mat-icon>
        </div>
      </div>
    </aside>
  `
})
export class Sidebar {
  sessions = input.required<ChatSession[]>();
  activeSessionId = input<string | null>(null);
  
  closeSidebar = output<void>();
  newChat = output<void>();
  selectSession = output<string>();
  deleteSession = output<string>();

  isProfileMenuOpen = signal(false);

  handleNewChat() {
    this.newChat.emit();
    this.closeSidebar.emit();
  }

  handleDelete(id: string, event: Event) {
    event.stopPropagation();
    this.deleteSession.emit(id);
  }
}
