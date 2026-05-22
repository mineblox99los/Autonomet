import { Component, ChangeDetectionStrategy, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { Skeleton } from './ui-patterns/skeleton';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { AppFooter } from './app-footer';
import { PageContainer } from './ui-patterns/page-container';
import { PageHeader } from './ui-patterns/page-header';
import { provideIcons } from '@ng-icons/core';
import { NotificationService } from './notification.service';
import { StorageService, NewsItem } from './storage.service';
import {
  lucideSearch,
  lucideSun,
  lucideCloud,
  lucideSettings,
  lucideUser,
  lucideHeart,
  lucideMessageCircle,
  lucideThumbsUp,
  lucideShare2,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronDown,
  lucideMoreHorizontal,
  lucideMail,
  lucideGlobe,
  lucideShoppingBag,
  lucideTrophy,
  lucidePlus,
  lucideArrowRight,
  lucideNewspaper
} from '@ng-icons/lucide';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmInput,
    HlmIconImports,
    HlmAvatarImports,
    HlmCardImports,
    Skeleton,
    HlmTabsImports,
    HlmTypographyImports,
    AppFooter,
    PageContainer,
    PageHeader
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideSun,
      lucideCloud,
      lucideSettings,
      lucideUser,
      lucideHeart,
      lucideMessageCircle,
      lucideThumbsUp,
      lucideShare2,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronDown,
      lucideMoreHorizontal,
      lucideMail,
      lucideGlobe,
      lucideShoppingBag,
      lucideTrophy,
      lucidePlus,
      lucideArrowRight,
      lucideNewspaper
    })
  ],
  templateUrl: './news-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsPage {
  searchQuery = signal('');
  isLoading = signal(true);
  
  categories = [
    'Discover', 'News', 'Sports', 'Play', 'Money'
  ];
  
  newsList = signal<NewsItem[]>([]);

  private readonly _document = inject(DOCUMENT);
  public readonly _router = inject(Router);
  private readonly _storage = inject(StorageService);
  private readonly _notifications = inject(NotificationService);

  constructor() {
    afterNextRender(() => {
      this.loadNews();
    });
  }

  async loadNews() {
    this.isLoading.set(true);
    try {
      const data = this._storage.getNews();
      this.newsList.set(data || []);
      // Artificially wait a bit to show skeletons
      setTimeout(() => this.isLoading.set(false), 1000);
    } catch (err) {
      console.error('Error loading news:', err);
      this.isLoading.set(false);
    }
  }

  goToArticle(item?: NewsItem) {
    if (item) {
      this._router.navigate(['/article'], { state: { article: item } });
    }
  }

  onSearch() {
    if (this.searchQuery().trim()) {
      this._notifications.show('Search functionality is under development.', 'info');
    }
  }

  onCategoryClick(cat: string) {
    if (cat === 'Discover') return;
    this._notifications.show(`The category "${cat}" is under development.`, 'info');
  }
}
