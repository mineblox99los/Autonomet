import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideInfo, lucideCheckCircle, lucideXCircle } from '@ng-icons/lucide';
import {lucideAlertTriangle, lucideX} from '@ng-icons/lucide';
import {AgentOrchestratorService} from './agent-orchestrator.service';
import {NotificationService} from './notification.service';
import {HlmAlertImports} from '@spartan-ng/helm/alert';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NgIcon, HlmAlertImports],
  providers: [
    provideIcons({
      lucideInfo,
      lucideCheckCircle,
      lucideAlertTriangle,
      lucideXCircle,
      lucideX
    })
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly _orchestrator = inject(AgentOrchestratorService);
  public readonly notificationService = inject(NotificationService);

  ngOnInit() {
    // Only start in browser environment to avoid SSR conflicts
    if (typeof window !== 'undefined') {
      this._orchestrator.startOrchestration();
    }
  }
}
