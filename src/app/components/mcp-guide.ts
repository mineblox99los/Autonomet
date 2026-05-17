import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mcp-guide',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gemini-bg text-zinc-300 font-sans pb-20">
      <!-- Navbar/Header -->
      <header class="sticky top-0 z-50 bg-gemini-bg/80 backdrop-blur-md border-b border-gemini-border px-4 py-3 flex items-center gap-4">
        <a routerLink="/" class="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <div>
          <h1 class="text-lg font-medium text-white">Guia de Configuração</h1>
          <p class="text-xs text-zinc-500">Gemini MCP & Skills</p>
        </div>
      </header>

      <main class="max-w-3xl mx-auto px-6 py-10">
        <div class="prose prose-invert prose-zinc max-w-none">
          <h1 class="text-white mb-6">Configure seu assistente de programação com o Gemini MCP e Skills</h1>
          
          <p class="text-lg text-zinc-400 mb-8 leading-relaxed">
            Assistentes de codificação de IA são poderosos, mas têm limitações — os dados de treinamento terminam em uma data específica, perdendo novos recursos e alterações da API. Sem acesso à documentação específica do Gemini, os agentes podem sugerir padrões genéricos em vez de abordagens otimizadas.
          </p>

          <div class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-12">
            <div class="flex gap-4">
              <p class="m-0 text-blue-100/80">
                Recomendamos configurar o <strong>Gemini Docs MCP</strong> e aprimorar seu ambiente com as <strong>Skills da API do Gemini</strong>. Embora essas ferramentas sejam utilizáveis de forma independente, elas foram projetadas para trabalhar juntas.
              </p>
            </div>
          </div>

          <section class="mb-12">
            <h2 class="text-white">
              Conecte o Gemini Docs MCP
            </h2>
            <p>
              O Gemini hospeda um servidor Model Context Protocol (MCP) público. Conectar seu agente de codificação a este servidor garante que todas as consultas tenham acesso às APIs mais recentes.
            </p>
            <div class="bg-black rounded-xl p-4 my-4 font-mono text-sm border border-white/5 relative group">
              <code class="text-blue-400">npx add-mcp "https://gemini-api-docs-mcp.dev"</code>
            </div>
            <p class="text-sm text-zinc-500">
              Este servidor adiciona a função <code>search_documentation</code> que seu agente pode usar para recuperar definições de API em tempo real.
            </p>
          </section>

          <section class="mb-12">
            <h2 class="text-white">Especificações do Gemini 3 Flash Preview</h2>
            <p class="text-sm text-zinc-400 mb-4">O Gemini 3 Flash Preview é o modelo mais avançado para compreensão multimodal e raciocínio de última geração.</p>
            <div class="overflow-x-auto bg-black/20 rounded-2xl border border-gemini-border">
              <table class="w-full text-sm text-left text-zinc-400 border-separate border-spacing-0">
                <thead class="text-zinc-500 uppercase text-[10px] tracking-widest bg-white/5">
                  <tr>
                    <th class="py-3 px-6 font-bold border-b border-gemini-border">Propriedade</th>
                    <th class="py-3 px-6 font-bold border-b border-gemini-border">Descrição</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gemini-border">
                  <tr>
                    <td class="py-4 px-6 font-medium text-zinc-300 whitespace-nowrap">Model code</td>
                    <td class="py-4 px-6 font-mono text-blue-400">gemini-3-flash-preview</td>
                  </tr>
                  <tr>
                    <td class="py-4 px-6 font-medium text-zinc-300">Tipos de dados</td>
                    <td class="py-4 px-6">
                      <span class="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Entradas</span>
                      Texto, Imagem, Vídeo, Áudio e PDF
                      <span class="text-zinc-500 uppercase text-[10px] font-bold block mt-2 mb-1">Saída</span>
                      Texto
                    </td>
                  </tr>
                  <tr>
                    <td class="py-4 px-6 font-medium text-zinc-300">Limites de tokens</td>
                    <td class="py-4 px-6">
                      <div class="flex flex-col gap-1">
                        <div><strong class="text-zinc-300">Entrada:</strong> 1.048.576</div>
                        <div><strong class="text-zinc-300">Saída:</strong> 65.536</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="py-4 px-6 font-medium text-zinc-300">Capacidades</td>
                    <td class="py-4 px-6 leading-relaxed">
                      Batch API, Caching, Code execution, Computer use, File search, Function calling, Grounding with Google Maps, Search grounding, Structured outputs, <strong class="text-blue-400">Thinking</strong>, URL context.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="mb-12 border-b border-gemini-border pb-12">
            <h2 class="text-white">
              Adicione Skills de Desenvolvimento
            </h2>
            <p>
              As skills fornecem <strong>regras integradas e práticas recomendadas</strong> diretamente no contexto do seu assistente.
            </p>

            <!-- gemini-api-dev -->
            <div class="border border-gemini-border rounded-2xl p-6 mb-6 hover:bg-white/5 transition-colors">
              <h3 class="text-white mt-0">gemini-api-dev</h3>
              <p class="text-sm text-zinc-400">A skill fundamental para o desenvolvimento geral do Gemini. Fornece documentação sobre roteamento de prompts, multimodalidade e chamadas de função.</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span class="text-[10px] uppercase tracking-wider text-zinc-500 block mb-2 font-bold">Instalar com skills.sh</span>
                  <code class="text-xs text-emerald-400">npx skills add google-gemini/gemini-skills --skill gemini-api-dev --global</code>
                </div>
                <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span class="text-[10px] uppercase tracking-wider text-zinc-500 block mb-2 font-bold">Instalar com Context7</span>
                  <code class="text-xs text-blue-400">npx ctx7 skills install /google-gemini/gemini-skills gemini-api-dev</code>
                </div>
              </div>
            </div>

            <!-- gemini-live-api-dev -->
            <div class="border border-gemini-border rounded-2xl p-6 mb-6 hover:bg-white/5 transition-colors">
              <h3 class="text-white mt-0">gemini-live-api-dev</h3>
              <p class="text-sm text-zinc-400">Skill para construir aplicações de conversação em tempo real com a Gemini Live API. Cobre WebSockets e streaming de baixa latência.</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span class="text-[10px] uppercase tracking-wider text-zinc-500 block mb-2 font-bold">Instalar com skills.sh</span>
                  <code class="text-xs text-emerald-400">npx skills add google-gemini/gemini-skills --skill gemini-live-api-dev --global</code>
                </div>
                <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span class="text-[10px] uppercase tracking-wider text-zinc-500 block mb-2 font-bold">Instalar com Context7</span>
                  <code class="text-xs text-blue-400">npx ctx7 skills install /google-gemini/gemini-skills gemini-live-api-dev</code>
                </div>
              </div>
            </div>
          </section>

          <section class="mb-12">
            <h2 class="text-white">
              Verifique a instalação
            </h2>
            <p>Após a instalação, confirme se o seu assistente pode se conectar ao servidor Gemini Docs MCP.</p>
            <div class="bg-zinc-900 border border-gemini-border rounded-2xl overflow-hidden">
               <div class="px-6 py-4 border-b border-gemini-border bg-white/5">
                 <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Prompt de teste</span>
               </div>
               <div class="p-6 italic text-zinc-300">
                 "Como eu uso o cache de contexto com a API do Gemini?"
               </div>
            </div>
          </section>

          <footer class="border-t border-gemini-border pt-12 mt-12">
             <div class="flex flex-col sm:flex-row gap-6 justify-between items-center text-sm text-zinc-500">
                <div class="flex gap-6">
                  <a href="https://github.com/google-gemini/gemini-skills" target="_blank" class="hover:text-white flex items-center gap-1">
                    GitHub Skills
                  </a>
                  <a href="https://ai.google.dev/gemini-api/docs/interactions" target="_blank" class="hover:text-white flex items-center gap-1">
                    Docs
                  </a>
                </div>
                <div>
                  <button (click)="scrollToTop()" class="flex items-center gap-2 hover:text-white cursor-pointer">
                    Voltar ao topo
                  </button>
                </div>
             </div>
          </footer>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class McpGuide {
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
