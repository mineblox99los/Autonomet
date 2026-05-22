import { Routes } from '@angular/router';
import { GoogleHome } from './google-home';
import { SearchResults } from './search-results';
import { NewsPage } from './news-page';
import { AllNewsPage } from './all-news-page';
import { ArticlePage } from './article-page';
import { SuperAgentPage } from './super-agent-page';

export const routes: Routes = [
  {
    path: '',
    component: GoogleHome,
  },
  {
    path: 'search',
    component: SearchResults,
  },
  {
    path: 'news',
    component: NewsPage,
  },
  {
    path: 'all-news',
    component: AllNewsPage,
  },
  {
    path: 'article',
    component: ArticlePage,
  },
  {
    path: 'super-agent',
    component: SuperAgentPage,
  }
];
