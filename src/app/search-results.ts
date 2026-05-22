import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { AppFooter } from './app-footer';
import { provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideMic,
  lucideX,
  lucideMoreVertical,
  lucideChevronDown,
  lucideChevronUp,
  lucideChevronRight,
  lucideExternalLink,
  lucidePlay,
  lucideImage,
  lucideNewspaper,
  lucideTag,
  lucideMoreHorizontal,
  lucideHistory,
  lucideArrowRight,
  lucideGlobe
} from '@ng-icons/lucide';

@Component({
  selector: 'app-search-results',
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
    HlmAccordionImports,
    HlmTypographyImports,
    AppFooter
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideMic,
      lucideX,
      lucideMoreVertical,
      lucideChevronDown,
      lucideChevronUp,
      lucideChevronRight,
      lucideExternalLink,
      lucidePlay,
      lucideImage,
      lucideNewspaper,
      lucideTag,
      lucideMoreHorizontal,
      lucideHistory,
      lucideArrowRight,
      lucideGlobe
    })
  ],
  templateUrl: './search-results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResults {
  private readonly _router = inject(Router);
  searchQuery = signal('artificial intelligence');

  sponsoredResults = [
    {
      title: 'Google Gemini | Gemini, Google\'s new AI model',
      url: 'https://gemini.google.com',
      displayUrl: 'https://gemini.google.com',
      description: 'Chat with Gemini to access the best of Google\'s AI. Experience Gemini Live - a new way to brainstorm/converse with Google Gemini. Over 1 million visits in the last month',
      cta: 'Direct access to Google AI',
      ctaDesc: 'An AI assistant to hold real, interactive conversations.',
      favicon: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128'
    },
    {
      title: 'Get Started with AI in 3 Clicks',
      url: 'https://www.zendesk.com',
      displayUrl: 'https://www.zendesk.com',
      description: 'AI-Powered Knowledge Base – Leverage AI for advanced analytics, as well as agile, smart, and automated customer support.',
      favicon: 'https://www.google.com/s2/favicons?domain=zendesk.com&sz=128'
    }
  ];

  images = [
    { src: 'https://picsum.photos/seed/ai1/400/300', title: 'The Complete Guide to Artificial In...', owner: 'Austral' },
    { src: 'https://picsum.photos/seed/ai2/400/300', title: 'Artificial intelligence: what is it...', owner: 'Desktop' },
    { src: 'https://picsum.photos/seed/ai3/400/300', title: 'General Artificial Intelligence...', owner: 'Metaverse' }
  ];

  organicResults = [
    {
      title: 'Artificial intelligence - Wikipedia',
      url: 'https://en.wikipedia.org > wiki > Artificial_intelligence',
      snippet: '<b>Artificial Intelligence</b> (abbreviated <b>AI</b>) is intelligence, reasoning, and learning demonstrated by machines, mimicking human processes; ...',
      favicon: 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=128'
    },
    {
      title: 'What is artificial intelligence (AI)?',
      url: 'https://cloud.google.com > what-is-artificial-intelligence',
      snippet: '<b>Artificial intelligence (AI)</b> is a discipline that enables computers to learn, reason, solve problems, and perform advanced cognitive tasks like human reasoning ...',
      favicon: 'https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128'
    }
  ];

  peopleAlsoAsk = [
    {
      q: 'What is artificial intelligence and what is it used for?',
      a: 'AI can be leveraged to automate repetitive tasks, freeing human resources to focus on complex decision making. Commonly applied in data analysis, document verification, audio transcription, content moderation, or answering customer support questions like "Where are you located?".',
      highlight: 'can be leveraged to automate repetitive tasks, freeing human resources to focus on complex decision making',
      source: {
        name: 'Google Cloud',
        url: 'https://cloud.google.com',
        displayUrl: 'https://cloud.google.com > what-is-artificial-intelligence',
        title: 'What is artificial intelligence (AI)? - Google Cloud',
        favicon: 'https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128'
      }
    },
    { q: 'What is the best free AI right now?' },
    { q: 'Which are the top 3 most popular AI tools?' },
    { q: 'Which AI website is free to use?' },
    { q: 'What are the 3 main types of artificial intelligence?' },
    { q: 'What are some disadvantages or risks of artificial intelligence?' }
  ];

  relatedSearches = [
    'Free artificial intelligence online',
    'Artificial intelligence images',
    'Free AI generators',
    'Artificial intelligence for teachers',
    'Artificial intelligence in the job market',
    'Best artificial intelligence list'
  ];

  onSearch() {
    if (!this.searchQuery().trim()) return;
    // Just refresh or navigate (already here usually)
  }

  goHome() {
    this._router.navigate(['/']);
  }
}
