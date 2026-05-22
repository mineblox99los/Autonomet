import { Directive, input, Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BrnResizableGroup, BrnResizablePanel, BrnResizableHandle } from '@spartan-ng/brain/resizable';
import { hlm } from '@spartan-ng/helm/utils';

@Directive({
  selector: 'app-resizable',
  standalone: true,
  hostDirectives: [
    {
      directive: BrnResizableGroup,
      inputs: ['direction', 'layout'],
      outputs: ['dragEnd', 'dragStart', 'layoutChange'],
    }
  ],
  host: {
    '[class]': '_computedClass()',
    'data-slot': 'resizable-group'
  }
})
export class Resizable {
  addClass = input<string>('', { alias: 'class' });
  protected _computedClass = () => hlm('group flex h-full w-full data-[panel-group-direction=vertical]:flex-col', this.addClass());
}

@Directive({
  selector: 'app-resizable-panel',
  standalone: true,
  hostDirectives: [
    {
      directive: BrnResizablePanel,
      inputs: ['defaultSize', 'id', 'collapsible', 'maxSize', 'minSize'],
    }
  ],
  host: {
    '[class]': '_computedClass()',
    'data-slot': 'resizable-panel'
  }
})
export class ResizablePanel {
  addClass = input<string>('', { alias: 'class' });
  protected _computedClass = () => hlm('block', this.addClass());
}

@Component({
  selector: 'app-resizable-handle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: BrnResizableHandle,
      inputs: ['withHandle', 'disabled'],
    }
  ],
  host: {
    '[class]': '_computedClass()',
    'data-slot': 'resizable-handle'
  },
  template: `
    @if (_brnResizableHandle.withHandle()) {
      <div class="bg-border z-10 flex h-6 w-1 shrink-0 rounded-lg"></div>
    }
  `
})
export class ResizableHandle {
  addClass = input<string>('', { alias: 'class' });
  protected readonly _brnResizableHandle = inject(BrnResizableHandle);
  
  protected _computedClass = () => hlm(
    'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90',
    'data-[panel-group-direction=horizontal]:hover:cursor-ew-resize data-[panel-group-direction=vertical]:hover:cursor-ns-resize',
    this.addClass()
  );
}

export const ResizablePatternImports = [Resizable, ResizablePanel, ResizableHandle] as const;
