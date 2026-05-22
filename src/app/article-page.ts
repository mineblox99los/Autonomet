import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { MarkdownPipe } from './markdown.pipe';
import { AppFooter } from './app-footer';
import { PageContainer } from './ui-patterns/page-container';
import { PageHeader } from './ui-patterns/page-header';
import { StorageService, NewsItem } from './storage.service';

@Component({
  selector: 'app-article-page',
  standalone: true,
  imports: [
    CommonModule,
    HlmTypographyImports,
    HlmCardImports,
    MarkdownPipe,
    AppFooter,
    PageContainer,
    PageHeader
  ],
  templateUrl: './article-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlePage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _storage = inject(StorageService);

  articleData = signal<NewsItem | null>(null);
  allNews = signal<NewsItem[]>([]);

  relatedNews = computed(() => {
    const current = this.articleData();
    if (!current) return [];
    
    return this.allNews()
      .filter(n => n.id !== current.id && n.category === current.category)
      .slice(0, 3);
  });

  // Dynamic font size calculation: 48px (small titles) down to 32px (64 chars)
  titleFontSize = computed(() => {
    const data = this.articleData();
    if (!data || !data.title) return '48px';
    
    const length = data.title.length;
    const minSize = 32;
    const maxSize = 48;
    const maxChars = 64;
    const minChars = 20;

    if (length <= minChars) return `${maxSize}px`;
    if (length >= maxChars) return `${minSize}px`;

    // Linear interpolation
    const size = maxSize - ((length - minChars) / (maxChars - minChars)) * (maxSize - minSize);
    return `${Math.round(size)}px`;
  });

  constructor() {
    const nav = this._router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.articleData.set(nav.extras.state['article']);
    }
  }

  ngOnInit() {
    this.loadAllNews();
  }

  async loadAllNews() {
    try {
      const data = this._storage.getNews();
      this.allNews.set(data || []);
    } catch (err) {
      console.error('Error loading related news:', err);
    }
  }

  goToArticle(item: NewsItem) {
    this.articleData.set(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack() {
    this._router.navigate(['/news']);
  }
}
