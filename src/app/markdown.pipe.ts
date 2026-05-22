import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  private _sanitizer = inject(DomSanitizer);

  async transform(value: string | undefined): Promise<SafeHtml> {
    if (!value) return '';
    
    // Ensure value is a string
    const content = String(value);
    
    // Configure marked to generate IDs for headings and custom code blocks
    const renderer = new marked.Renderer();
    
    renderer.heading = ({ text, depth }) => {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      const level = depth;
      return `<h${level} id="${escapedText}">${text}</h${level}>`;
    };

    renderer.code = ({ text, lang }) => {
      const lineCount = text.split('\n').length;
      const isExpandable = lineCount > 10;
      const uniqueId = 'code-' + Math.random().toString(36).substring(2, 9);

      return `
        <div class="code-block-container relative group bg-[#121212] border border-white/[0.08] rounded-xl overflow-hidden my-8 transition-all duration-300" 
             style="${isExpandable ? 'max-height: 320px;' : ''}" data-expanded="false" id="${uniqueId}">
          
          <!-- Copy Button -->
          <button class="copy-code-btn absolute right-4 top-4 p-2 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition-all z-20 group/copy"
                  data-code="${btoa(unescape(encodeURIComponent(text)))}" title="Copiar código">
            <span class="copy-icon flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 text-white/30 group-hover/copy:text-white/60 transition-colors pointer-events-none"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </span>
            <span class="check-icon hidden items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 text-emerald-400 pointer-events-none"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </button>

          <div class="overflow-x-auto custom-scrollbar w-full">
            <pre class="p-8 text-[13px] text-white/70 leading-6 whitespace-pre font-mono"><code>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>

          <!-- Expand Overlay & Button -->
          ${isExpandable ? `
            <div class="expand-overlay absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#121212] via-[#121212]/90 to-transparent flex items-end justify-center pb-4 transition-all duration-300 pointer-events-none z-10 group-data-[expanded=true]:opacity-0 group-data-[expanded=true]:invisible"></div>
            <div class="expand-btn-wrapper absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center w-full z-20 pointer-events-auto">
                <button class="expand-code-btn flex items-center gap-2.5 rounded-lg font-medium bg-[#1a1a1a] border border-white/10 shadow-2xl hover:bg-[#222] h-10 px-5 transition-all text-xs text-white active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 opacity-60"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                    <span class="expand-text">Expandir código</span>
                </button>
            </div>
          ` : ''}
        </div>
      `;
    };

    const html = await marked.parse(content, { renderer });
    
    // Clean HTML but allow Spartan and Brain UI tags/attributes for MDX support
    const cleanHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: [
        'app-ds-code-block',
        'hlm-accordion', 'hlm-accordion-item', 'hlm-accordion-trigger', 'hlm-accordion-content',
        'hlm-alert', 'hlm-alert-title', 'hlm-alert-description',
        'hlm-tabs', 'hlm-tabs-list', 'hlm-tabs-content',
        'hlm-separator', 'hlm-progress', 'hlm-skeleton', 'hlm-switch', 'hlm-slider',
        'hlm-dialog', 'hlm-dialog-content', 'hlm-sheet', 'hlm-sheet-content',
        'hlm-popover', 'hlm-popover-content', 'hlm-tooltip', 'hlm-tooltip-content',
        'hlm-table', 'hlm-trow', 'hlm-th', 'hlm-td',
        'hlm-breadcrumb', 'hlm-breadcrumb-list', 'hlm-breadcrumb-item', 'hlm-breadcrumb-separator',
        'hlm-avatar', 'hlm-menu-bar', 'hlm-command'
      ],
      ADD_ATTR: [
        'hlmBtn', 'hlmBadge', 'hlmInput', 'hlmLabel', 'hlmH1', 'hlmH2', 'hlmH3', 'hlmH4', 
        'hlmP', 'hlmMuted', 'hlmLead', 'hlmLarge', 'variant', 'defaultValue', 'value', 'max', 'step',
        'data-code', 'data-expanded'
      ]
    });
    
    // Return safe HTML
    return this._sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
