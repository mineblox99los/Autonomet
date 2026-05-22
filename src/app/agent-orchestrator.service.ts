import { Injectable, inject } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { LogService } from './log.service';
import { StorageService, Agent } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AgentOrchestratorService {
  private readonly _storageService = inject(StorageService);
  private readonly _logService = inject(LogService);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _intervals = new Map<string, any>();

  private getAI(apiKey?: string) {
    const key = apiKey || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '');
    return new GoogleGenAI({ apiKey: key });
  }

  startOrchestration() {
    this._logService.addLog('Agent Orchestrator initialized in browser.', 'info');
    this.refreshAgents();
    // Refresh list every minute to catch new agents or deletions
    setInterval(() => this.refreshAgents(), 60000);
  }

  async refreshAgents() {
    try {
      const agents = this._storageService.getAgents();
      if (!agents) return;

      // Sync intervals
      const activeIds = new Set(agents.map(a => a.id));
      
      // Stop removed agents
      for (const [id, interval] of this._intervals) {
        if (!activeIds.has(id)) {
          clearInterval(interval);
          this._intervals.delete(id);
          this._logService.addLog(`Monitoring of agent ${id} terminated.`, 'info');
        }
      }

      // Start new agents
      for (const agent of agents) {
        if (!this._intervals.has(agent.id) && agent.status === 'Running') {
          this.setupAgentTimer(agent);
        }
      }
    } catch (err) {
      console.error('Failed to sync agents:', err);
    }
  }

  private setupAgentTimer(agent: Agent) {
    const run = () => this.executeAgentTask(agent);
    
    // Initial run
    run();
    
    const intervalMs = agent.frequency * 60000;
    const interval = setInterval(run, intervalMs);
    this._intervals.set(agent.id, interval);
    this._logService.addLog(`Agent "${agent.name}" scheduled (freq: ${agent.frequency}m).`, 'success');
  }

  async executeAgentTask(agent: Agent) {
    this._logService.addLog(`Agent "${agent.name}" starting task with Gemini...`, 'info', agent.id);
    
    try {
      const ai = this.getAI(agent.apiKey || agent.api_key);
      this._storageService.updateAgent(agent.id, { status: 'Working' });
      
      const prompt = `Act as an elite investigative journalist. Your name is ${agent.name}.
      
      AGENT CONTEXT:
      - Goal: ${agent.goal}
      - Specialty: ${agent.category}
      
      REQUIRED CAPABILITIES (Maximum Potential):
      1. Deep Reasoning: Analyze multiple sources and connect non-obvious dots.
      2. Real-time Search: Find the most recent developments and news.
      3. Fact Verification: Ensure maximum accuracy and check all sources.
      
      YOUR TASK:
      Create an impactful news article based on your goal. The news article MUST be written in English.
      Be bold, but ethical and accurate.
      IMPORTANT: 
      - The title ("title") must be at most 64 characters long.
      - The content ("content") MUST be formatted using Markdown for excellent readability (use bold text, bullet points, headings/subheadings where appropriate).
      - Use ONLY ONE primary category related to your context.
      
      REQUIRED OUTPUT FORMAT (JSON):
      {
        "title": "Killer headline",
        "source": "Name of simulated news vehicle or platform",
        "content": "Full, complete, professional news body text in English with Markdown styling",
        "reasoning": "Brief explanation of the editorial reasoning behind this choices",
        "fact_check_status": "Verified via real-time search"
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ googleSearch: {} }] as any,
          responseMimeType: 'application/json',
          temperature: 0.7,
          topP: 0.95
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.title) {
        this._storageService.addNews({
          title: result.title,
          source: result.source || agent.name,
          category: agent.category,
          content: result.content,
          agent_id: agent.id,
          image: ''
        });
        
        this._logService.addLog(`Agent "${agent.name}" published: ${result.title}`, 'success', agent.id);
      }

      this._storageService.updateAgent(agent.id, { 
        status: 'Running',
        lastRun: new Date().toISOString()
      });

    } catch (err) {
      this._logService.addLog(`Error executing agent "${agent.name}": ${(err as Error).message}`, 'error', agent.id);
      this._storageService.updateAgent(agent.id, { status: 'Error' });
    }
  }
}
