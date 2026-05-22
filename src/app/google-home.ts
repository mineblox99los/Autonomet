import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { AppFooter } from './app-footer';
import { provideIcons } from '@ng-icons/core';
import { NotificationService } from './notification.service';
import {
  lucideSearch,
  lucidePlus,
  lucideMoon,
  lucideStar,
  lucideMail,
  lucideYoutube,
  lucideGlobe,
  lucideMic,
  lucideNewspaper,
  lucideChevronRight,
  lucideCpu,
  lucideHistory,
  lucideTrendingUp,
  lucideKeyboard,
  lucideCamera,
  lucideSparkles,
  lucideTrash2,
  lucideAlertTriangle
} from '@ng-icons/lucide';

@Component({
  selector: 'app-google-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HlmButton,
    HlmInput,
    HlmIconImports,
    HlmAvatarImports,
    HlmTooltipImports,
    HlmTypographyImports,
    HlmAlertImports,
    AppFooter
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucidePlus,
      lucideMoon,
      lucideStar,
      lucideMail,
      lucideYoutube,
      lucideGlobe,
      lucideMic,
      lucideNewspaper,
      lucideChevronRight,
      lucideCpu,
      lucideHistory,
      lucideTrendingUp,
      lucideKeyboard,
      lucideCamera,
      lucideSparkles,
      lucideTrash2,
      lucideAlertTriangle
    })
  ],
  templateUrl: './google-home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleHome {
  private readonly _document = inject(DOCUMENT);
  private readonly _router = inject(Router);
  private readonly _notifications = inject(NotificationService);

  theme = signal<'dark'>('dark');
  useScenicBg = signal(false); 
  searchQuery = signal('');
  isSearchFocused = signal(false);

  history = [
    { text: 'artificial intelligence', type: 'history' },
    { text: 'anthropic', type: 'history', sub: 'Images' },
    { text: 'minecraft terrain', type: 'history', sub: 'Images' },
    { text: 'google', type: 'history' },
    { text: 'world quantum day', type: 'history' },
  ];

  trending = [
    { text: 'big brother award show', type: 'trending', sub: 'Day 101 — TV Episode', icon: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=40&h=40&auto=format&fit=crop' },
    { text: 'chevrolet sonic 2027', type: 'trending' },
    { text: 'moon phases today', type: 'trending' },
    { text: 'championship football tickets', type: 'trending' },
    { text: 'national web stream news', type: 'trending' },
  ];

  onBlur() {
    setTimeout(() => {
      this.isSearchFocused.set(false);
    }, 200);
  }

  onSearch() {
    this._notifications.show('Search functionality is under development.', 'info');
  }

  showNotification(message: string) {
    this._notifications.show(message, 'info');
  }

  goToNews() {
    this._router.navigate(['/news']);
  }

  goToSuperAgent() {
    this._router.navigate(['/super-agent']);
  }

  toggleBg() {
    this.useScenicBg.update(v => !v);
  }

}
