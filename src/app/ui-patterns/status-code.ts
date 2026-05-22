import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-code',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'inline-flex items-center gap-1.5 font-mono text-[10px] font-bold ' + className()">
      @if (method()) {
        <span class="text-muted-foreground opacity-50">{{ method() }}</span>
      }
      <span [class]="colorClasses()" class="px-1.5 py-0.5 rounded border shadow-sm transition-colors">
        {{ statusCode() }}
      </span>
    </div>
  `
})
export class StatusCode {
  statusCode = input<number | string | undefined>();
  method = input<string>();
  className = input<string>('');

  protected colorClasses = computed(() => {
    const code = String(this.statusCode() || '').toLowerCase();
    
    if (code.startsWith('4') || code === 'warning' || code === 'redirect') {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    
    if (code.startsWith('5') || code === 'error') {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    
    // 1xx, 2xx, 3xx, info, success
    return 'bg-muted/30 text-muted-foreground border-border';
  });
}
