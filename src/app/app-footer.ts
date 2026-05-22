import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, HlmTypographyImports],
  template: `
    <footer [class]="'relative z-10 bg-surface-100 border-t border-border py-4 ' + customClass()">
      <div class="w-full mx-auto px-6">
        <div class="flex flex-col sm:flex-row items-center sm:justify-between gap-6 sm:gap-4 text-xs font-normal text-muted-foreground/80">
          <div hlmSmall class="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 leading-none">
            <a href="#" (click)="onLinkClick($event, 'About')" class="hover:underline">About</a>
            <a href="#" (click)="onLinkClick($event, 'Advertising')" class="hover:underline">Advertising</a>
            <a href="#" (click)="onLinkClick($event, 'Business')" class="hover:underline">Business</a>
            <a href="#" (click)="onLinkClick($event, 'How Search works')" class="hover:underline">How Search works</a>
          </div>
          <div hlmSmall class="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 leading-none">
            <a href="#" (click)="onLinkClick($event, 'Privacy')" class="hover:underline">Privacy</a>
            <a href="#" (click)="onLinkClick($event, 'Terms')" class="hover:underline">Terms</a>
            <a href="#" (click)="onLinkClick($event, 'Settings')" class="hover:underline">Settings</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooter {
  private readonly _notifications = inject(NotificationService);
  
  customClass = input<string>('');

  onLinkClick(event: Event, linkName: string) {
    event.preventDefault();
    this._notifications.show(`${linkName} functionality is under development.`, 'info');
  }
}
