import { Component, ChangeDetectionStrategy, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { AppFooter } from './app-footer';
import { provideIcons } from '@ng-icons/core';
import { StorageService, NewsItem } from './storage.service';
import {
  lucideArrowLeft,
  lucideSun,
  lucideArrowRight,
  lucideSearch
} from '@ng-icons/lucide';

@Component({
  selector: 'app-all-news-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmInput,
    HlmIconImports,
    HlmTypographyImports,
    AppFooter
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideSun,
      lucideArrowRight,
      lucideSearch
    })
  ],
  templateUrl: './all-news-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllNewsPage {
  newsList = signal<NewsItem[]>([]);
  searchQuery = signal('');

  private readonly _document = inject(DOCUMENT);
  public readonly _router = inject(Router);
  private readonly _storage = inject(StorageService);

  constructor() {
    afterNextRender(() => {
      this.loadNews();
    });
  }

  async loadNews() {
    try {
      const data = this._storage.getNews();
      this.newsList.set(data || []);
    } catch (err) {
      console.error('Error loading news:', err);
    }
  }

  goToArticle(item: NewsItem) {
    this._router.navigate(['/article'], { state: { article: item } });
  }

  goBack() {
    this._router.navigate(['/news']);
  }

  onSearch() {
    if (this.searchQuery().trim()) {
      this._router.navigate(['/search'], { queryParams: { q: this.searchQuery() } });
    }
  }
}
