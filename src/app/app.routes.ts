import { Routes } from '@angular/router';
import { Terms } from './components/terms';
import { Privacy } from './components/privacy';
import { ChatView } from './components/chat-view';
import { McpGuide } from './components/mcp-guide';

export const routes: Routes = [
  { path: 'terms', component: Terms },
  { path: 'privacy', component: Privacy },
  { path: 'guide', component: McpGuide },
  { path: '', component: ChatView },
  { path: '**', redirectTo: '' }
];
