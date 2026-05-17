import { Routes } from '@angular/router';
import { Terms } from './components/terms';
import { Privacy } from './components/privacy';
import { ChatView } from './components/chat-view';

export const routes: Routes = [
  { path: 'terms', component: Terms },
  { path: 'privacy', component: Privacy },
  { path: '', component: ChatView },
  { path: '**', redirectTo: '' }
];
