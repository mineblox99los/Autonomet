import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule, HlmSkeleton],
  template: `
    @switch (variant()) {
      @case ('news-card') {
        <div class="flex flex-col h-full bg-card/50 border border-border/50 rounded-2xl overflow-hidden">
          <div hlmSkeleton class="h-48 w-full"></div>
          <div class="p-6 space-y-4">
            <div class="space-y-2">
              <div hlmSkeleton class="h-5 w-3/4"></div>
              <div hlmSkeleton class="h-4 w-1/2"></div>
            </div>
            <div class="pt-4 flex items-center justify-between">
              <div hlmSkeleton class="h-4 w-20 rounded-full"></div>
              <div hlmSkeleton class="h-4 w-12"></div>
            </div>
          </div>
        </div>
      }
      @case ('article-featured') {
        <div class="relative rounded-2xl overflow-hidden min-h-[240px] border border-border bg-card/50 p-8 flex flex-col justify-center space-y-6">
           <div hlmSkeleton class="h-4 w-24"></div>
           <div class="space-y-3">
             <div hlmSkeleton class="h-10 w-full lg:w-3/4"></div>
             <div hlmSkeleton class="h-10 w-1/2"></div>
           </div>
           <div class="flex gap-6 mt-4">
              <div hlmSkeleton class="h-6 w-16 rounded-full"></div>
              <div hlmSkeleton class="h-6 w-16 rounded-full"></div>
           </div>
        </div>
      }
      @case ('circle') {
        <div hlmSkeleton class="rounded-full shrink-0" [class]="addClass()"></div>
      }
      @case ('text') {
        <div class="space-y-2" [class]="addClass()">
          <div hlmSkeleton class="h-4 w-full"></div>
          <div hlmSkeleton class="h-4 w-5/6"></div>
          <div hlmSkeleton class="h-4 w-4/6"></div>
        </div>
      }
      @default {
        <div hlmSkeleton [class]="addClass()"></div>
      }
    }
  `
})
export class Skeleton {
  variant = input<'default' | 'news-card' | 'article-featured' | 'circle' | 'text'>('default');
  addClass = input<string>('', { alias: 'class' });
}
