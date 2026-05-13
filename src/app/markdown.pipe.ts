import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  constructor() {
    marked.setOptions({
      highlight: function(code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  transform(value: string | undefined): SafeHtml {
    if (!value) return '';
    try {
      const html = marked.parse(value, { async: false }) as string;
      const sanitizedHtml = DOMPurify.sanitize(html);
      return this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml);
    } catch (e) {
      console.error('Markdown error:', e);
      return value || '';
    }
  }
}
