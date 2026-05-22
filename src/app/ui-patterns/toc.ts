import { 
  Component, 
  Directive, 
  ElementRef, 
  Injectable, 
  Input, 
  OnInit, 
  OnDestroy, 
  computed, 
  inject, 
  input, 
  signal, 
  afterNextRender,
  ChangeDetectionStrategy,
  ContentChildren,
  QueryList,
  AfterContentInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollArea } from './scroll-area';

export interface TOCHeader {
  id: string;
  text: string;
  level: number;
}

@Injectable()
export class TocService {
  private _headers = signal<TOCHeader[]>([]);
  private _activeId = signal<string | null>(null);

  headers = this._headers.asReadonly();
  activeId = this._activeId.asReadonly();

  setHeaders(headers: TOCHeader[]) {
    this._headers.set(headers);
  }

  setActiveId(id: string | null) {
    this._activeId.set(id);
  }
}

@Component({
  selector: 'app-toc',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollArea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [class]="addClass()" class="flex flex-col gap-4">
      <ng-content select="[title]"></ng-content>
      <app-scroll-area variant="minimal" class="max-h-[70vh]">
        <div class="flex flex-col border-l border-border/50 ml-px">
          @for (item of tocService.headers(); track item.id) {
            <a
              [routerLink]="[]"
              [fragment]="item.id"
              (click)="scrollTo(item.id)"
              [class.text-primary]="tocService.activeId() === item.id"
              [class.font-medium]="tocService.activeId() === item.id"
              [class.text-muted-foreground]="tocService.activeId() !== item.id"
              [class.border-l-2]="tocService.activeId() === item.id"
              [class.border-primary]="tocService.activeId() === item.id"
              [class.-ml-[2px]]="tocService.activeId() === item.id"
              [style.padding-left.rem]="item.level === 3 ? 1.5 : 1"
              class="py-1.5 pr-4 text-xs transition-colors hover:text-foreground cursor-pointer block"
            >
              {{ item.text }}
            </a>
          }
        </div>
      </app-scroll-area>
    </nav>
  `
})
export class Toc {
  addClass = input<string>('');
  tocService = inject(TocService);

  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

@Directive({
  selector: '[appTocAnchor]',
  standalone: true
})
export class TocAnchorDirective implements OnInit {
  id = input.required<string>({ alias: 'appTocAnchor' });
  text = input.required<string>();
  level = input<number>(2);
  
  private el = inject(ElementRef);
  private tocService = inject(TocService);

  ngOnInit() {
    // This is handled by the provider scanning or registration
  }
}

@Component({
  selector: 'app-anchor-provider',
  standalone: true,
  imports: [CommonModule],
  providers: [TocService],
  template: `<ng-content></ng-content>`
})
export class AnchorProvider implements AfterContentInit, OnDestroy {
  containerId = input<string>();
  scanSelector = input<string>('h2, h3');
  single = input<boolean>(true);
  
  private el = inject(ElementRef);
  private tocService = inject(TocService);
  private observer?: IntersectionObserver;
  private mutationObserver?: MutationObserver;

  constructor() {
    afterNextRender(() => {
      this.initScan();
      this.setupMutationObserver();
    });
  }

  ngAfterContentInit() {
    // Initial scan handled by afterNextRender
  }

  private setupMutationObserver() {
    const container = this.containerId() 
      ? document.getElementById(this.containerId()!) 
      : this.el.nativeElement;

    if (!container) return;

    this.mutationObserver = new MutationObserver(() => {
      this.initScan();
    });

    this.mutationObserver.observe(container, {
      childList: true,
      subtree: true
    });
  }

  private initScan() {
    const container = this.containerId() 
      ? document.getElementById(this.containerId()!) 
      : this.el.nativeElement;

    if (!container) return;

    const headings = Array.from(container.querySelectorAll(this.scanSelector())) as Element[];
    const headers: TOCHeader[] = headings
      .filter((h: any) => h.id)
      .map((h: any) => ({
        id: h.id,
        text: h.textContent?.replace('#', '').trim() || '',
        level: h.tagName === 'H2' ? 2 : 3
      }));

    this.tocService.setHeaders(headers);

    this.initObserver(headings);
  }

  private initObserver(elements: Element[]) {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // If single is true, pick the first one visible
          // Otherwise, maybe the first one or a different logic
          this.tocService.setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
      }
    );

    elements.forEach((el) => {
      if (el.id) this.observer?.observe(el);
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.mutationObserver?.disconnect();
  }
}

export const TocPatternImports = [Toc, AnchorProvider, TocAnchorDirective] as const;
