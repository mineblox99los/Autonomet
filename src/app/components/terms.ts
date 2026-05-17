import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
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
        <h1 class="text-4xl font-bold text-white mb-4">Termos de Uso</h1>
        <p class="text-zinc-500">Última atualização: 16 de Maio de 2026</p>
      </header>

      <div class="space-y-8 leading-relaxed">
        <section>
          <h2 class="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar o Superintelligence, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar o serviço.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">2. Uso do Serviço</h2>
          <p>O Superintelligence é uma interface de inteligência artificial experimental. Você concorda em usar o serviço apenas para fins lícitos e de acordo com estes termos.</p>
          <ul class="list-disc ml-6 mt-4 space-y-2 text-zinc-400">
            <li>Não use o serviço para gerar conteúdo abusivo, ilegal ou prejudicial.</li>
            <li>Não tente interferir no funcionamento correto do sistema.</li>
            <li>Você é responsável por todas as mensagens enviadas através da sua conta.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">3. Chaves de API e Limites</h2>
          <p>Se você fornecer sua própria chave de API do Gemini, você é o único responsável pelo uso e faturamento associado a essa chave junto ao Google Cloud/AI Studio.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">4. Isenção de Responsabilidade</h2>
          <p class="bg-white/5 p-4 rounded-xl border border-white/10">
            A Inteligência Artificial pode gerar informações imprecisas ou fictícias. O Superintelligence não garante a veracidade, precisão ou atualidade das informações geradas pela IA. Verifique sempre informações críticas.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">5. Propriedade Intelectual</h2>
          <p>O conteúdo gerado pela IA pertence a você conforme os termos da licença do modelo subjacente (Google Gemini), mas a interface e o software Superintelligence são protegidos por direitos autorais.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-4">6. Alterações nos Termos</h2>
          <p>Reservamos o direito de modificar estes termos a qualquer momento. O uso continuado do serviço após tais alterações constitui sua aceitação dos novos termos.</p>
        </section>
      </div>

      <footer class="mt-24 pt-12 border-t border-white/5 text-center text-zinc-500 text-sm">
        <p>&copy; 2026 Superintelligence. Todos os direitos reservados.</p>
      </footer>
    </div>
  `
})
export class Terms {}
