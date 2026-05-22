import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { ResizablePatternImports } from './ui-patterns/resizable';
import { ScrollArea } from './ui-patterns/scroll-area';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { PageContainer } from './ui-patterns/page-container';
import { PageHeader } from './ui-patterns/page-header';
import { PageSection } from './ui-patterns/page-section';
import { InfoTooltip } from './ui-patterns/info-tooltip';
import { DataInput } from './ui-patterns/data-input';
import { StatusCode } from './ui-patterns/status-code';
import { ErrorDisplay } from './ui-patterns/error-display';
import { TextConfirmDialog } from './ui-patterns/text-confirm-dialog';
import { FormItemLayout } from './ui-patterns/form-item-layout';
import { 
  lucideHelpCircle, 
  lucideExternalLink, 
  lucideCpu, 
  lucideZap, 
  lucideCheckCircle2, 
  lucideChevronDown, 
  lucideChevronUp,
  lucideHistory,
  lucideKey,
  lucideBarChart3,
  lucidePlusCircle,
  lucideRefreshCw,
  lucideAlertTriangle
} from '@ng-icons/lucide';
import { LogService } from './log.service';
import { AppFooter } from './app-footer';
import { StorageService, Agent } from './storage.service';

@Component({
  selector: 'app-super-agent-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HlmButton,
    HlmInput,
    HlmCardImports,
    ResizablePatternImports,
    ScrollArea,
    HlmTypographyImports,
    HlmAlertDialogImports,
    BrnAlertDialogImports,
    InfoTooltip,
    DataInput,
    StatusCode,
    ErrorDisplay,
    TextConfirmDialog,
    FormItemLayout,
    HlmIconImports,
    AppFooter,
    PageContainer,
    PageHeader,
    PageSection
  ],
  providers: [
    provideIcons({ 
      lucideHelpCircle, 
      lucideExternalLink, 
      lucideCpu, 
      lucideZap, 
      lucideCheckCircle2, 
      lucideChevronDown, 
      lucideChevronUp,
      lucideHistory,
      lucideKey,
      lucideBarChart3,
      lucidePlusCircle,
      lucideRefreshCw,
      lucideAlertTriangle
    })
  ],
  templateUrl: './super-agent-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAgentPage {
  protected readonly _router = inject(Router);
  private readonly _storage = inject(StorageService);
  private readonly _fb = inject(FormBuilder);
  protected readonly logService = inject(LogService);

  // Form for New Agent
  agentForm = this._fb.group({
    name: ['', [Validators.required]],
    goal: ['', [Validators.required, Validators.minLength(10)]],
    apiKey: ['', [Validators.required, Validators.minLength(20)]] // Required API Key
  });

  activeAgents = signal<Agent[]>([]);
  expandedAgentId = signal<string | null>(null);
  isAddingAgent = signal(false);
  isDeleteDialogOpen = signal(false);
  agentToDelete = signal<Agent | null>(null);
  deploymentError = signal<{ title: string; message: string } | null>(null);

  // Multiple keys verification
  hasMultipleKeys = computed(() => {
    const agents = this.activeAgents();
    const currentKey = this.agentForm.get('apiKey')?.value;
    
    // If the user is trying to type a key and agents already exist
    return currentKey && agents.length > 0;
  });

  // Computeds for form status
  isNameMissing = computed(() => {
    const control = this.agentForm.get('name');
    return !!(control?.touched && control?.errors?.['required']);
  });

  isGoalMissing = computed(() => {
    const control = this.agentForm.get('goal');
    return !!(control?.touched && (control?.errors?.['required'] || control?.errors?.['minlength']));
  });

  isApiKeyMissing = computed(() => {
    const control = this.agentForm.get('apiKey');
    return !!(control?.touched && (control?.errors?.['required'] || control?.errors?.['minlength']));
  });

  constructor() {
    this.loadAgents();
  }

  async loadAgents() {
    try {
      const agents = this._storage.getAgents();
      this.activeAgents.set(agents || []);
    } catch {
      this.logService.addLog('Failed to load agents list.', 'error');
    }
  }

  async toggleAgentExpansion(agent: Agent) {
    if (this.expandedAgentId() === agent.id) {
      this.expandedAgentId.set(null);
    } else {
      this.expandedAgentId.set(agent.id);
      // Load posts if they do not exist
      if (!agent.posts) {
        try {
          const posts = this._storage.getNewsForAgent(agent.id);
          this.activeAgents.update(list => list.map(a => 
            a.id === agent.id ? { ...a, posts: posts || [] } : a
          ));
        } catch {
          this.logService.addLog('Error loading agent posts.', 'error');
        }
      }
    }
  }

  async deployAgent() {
    if (this.agentForm.invalid) {
      this.logService.addLog(`Required fields are missing for agent configuration.`, 'warning');
      this.agentForm.markAllAsTouched();
      return;
    }

    const agentName = this.agentForm.get('name')?.value;
    this.logService.addLog(`Starting deployment of agent "${agentName}"...`, 'info');
    this.deploymentError.set(null);

    try {
      const newAgent = this.agentForm.value as Agent;
      this._storage.saveAgent(newAgent);
      
      this.logService.addLog(`Agent "${agentName}" successfully deployed! Autonomous orchestration started.`, 'success');
      this.agentForm.reset();
      this.isAddingAgent.set(false);
      await this.loadAgents();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.status === 409 && err.error?.error === 'API_KEY_DUPLICATE') {
        const errorMsg = err.error.message || 'This API key is already in use by another active agent.';
        this.logService.addLog(`Duplication Error: ${errorMsg}`, 'error');
        this.deploymentError.set({ title: 'Duplicate API Key', message: errorMsg });
      } else {
        const details = err.error?.details || err.error?.message || err.message || 'Unknown error';
        this.logService.addLog(`Critical deployment failure: ${details}`, 'error');
        this.deploymentError.set({ title: 'Deployment Failure', message: details });
      }
    }
  }

  prepareDelete(agent: Agent) {
    this.agentToDelete.set(agent);
    this.isDeleteDialogOpen.set(true);
  }

  async confirmDelete() {
    const agent = this.agentToDelete();
    if (!agent) return;

    this.logService.addLog(`Removing agent "${agent.name}"...`, 'info');
    try {
      this._storage.deleteAgent(agent.id);
      this.logService.addLog(`Agent "${agent.name}" permanently removed. Credentials wiped.`, 'success');
      this.isDeleteDialogOpen.set(false);
      this.agentToDelete.set(null);
      await this.loadAgents();
    } catch {
      this.logService.addLog(`Error deleting agent "${agent.name}".`, 'error');
    }
  }

  async deleteAgent(agent: Agent) {
    // This will be replaced by prepareDelete in UI
    this.prepareDelete(agent);
  }

  copyLogs() {
    const logText = this.logService.logs()
      .map(log => `[${log.timestamp.toISOString()}] [${log.type.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      this.logService.addLog('Logs copied to clipboard', 'success');
    });
  }

  goBack() {
    this._router.navigate(['/']);
  }
}
