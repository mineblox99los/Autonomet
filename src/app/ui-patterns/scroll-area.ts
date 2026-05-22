import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmScrollArea } from '@spartan-ng/helm/scroll-area';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-scroll-area',
  standalone: true,
  imports: [CommonModule, HlmScrollArea, NgScrollbarModule],
  template: `
    <ng-scrollbar hlm [class]="addClass()" [class.custom-scrollbar]="variant() === 'minimal'">
       <ng-content></ng-content>
    </ng-scrollbar>
  `,
  styles: [`
    :host { 
        display: block;
        height: 100%;
        width: 100%;
    }
  `]
})
export class ScrollArea {
  addClass = input<string>('', { alias: 'class' });
  variant = input<'default' | 'minimal'>('default');
}
