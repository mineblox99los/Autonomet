import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gemini-bg text-zinc-300 font-sans p-6 sm:p-12 max-w-4xl mx-auto">
      <header class="mb-12">
        <a routerLink="/" class="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group">
          <mat-icon class="scale-90 group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
          <span>Voltar ao Chat</span>
        </a>
        <h1 class="text-4xl font-bold text-white mb-4">Política de Privacidade</h1>
        <p class="text-zinc-500">Última atualização: 16 de Maio de 2026</p>
      </header>

      <div class="space-y-8 leading-relaxed">
        <section>
          <h2 class="text-xl font-bold text-white mb-4">1. Coleta de Dados</h2>
          <p>Nós valorizamos sua privacidade. O Superintelligence coleta apenas o estritamente necessário para o funcionamento do serviço:</p>
          <ul class="list-disc ml-6 mt-4 space-y-2 text-zinc-400">
            <li>O histórico de chat é armazenado localmente no seu navegador (LocalStorage) ou enviado ao nosso servidor para processamento via API.</li>
            <li>Sua chave de API (se fornecida) é usada apenas para autenticar pedidos com o Google e não é armazenada de forma persistente em nossos bancos de dados por padrão.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">2. Processamento com IA</h2>
          <p>Suas mensagens são enviadas para os modelos do Google Gemini. O processamento desses dados segue a Política de Privacidade do Google AI Studio / Google Cloud.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">3. Armazenamento Local</h2>
          <p>Usamos o armazenamento local do seu navegador para manter suas conversas e preferências, permitindo que você retome seus chats entre sessões.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">4. Segurança</h2>
          <p>Implementamos medidas de segurança para proteger suas informações, mas lembre-se que nenhum método de transmissão pela internet é 100% seguro.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">5. Seus Direitos</h2>
          <p>Você tem o direito de acessar, corrigir ou excluir seus dados a qualquer momento. No nosso caso, você pode fazer isso limpando o cache/armazenamento do seu navegador ou deletando os chats na barra lateral.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">6. Contato</h2>
          <p>Se tiver dúvidas sobre nossa política de privacidade, entre em contato através das configurações do aplicativo.</p>
        </section>
      </div>

      <footer class="mt-24 pt-12 border-t border-white/5 text-center text-zinc-500 text-sm">
        <p>&copy; 2026 Superintelligence. Todos os direitos reservados.</p>
      </footer>
    </div>
  `
})
export class Privacy {}
