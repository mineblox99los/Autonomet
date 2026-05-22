import { Injectable, signal } from '@angular/core';

export interface Agent {
  id: string;
  name: string;
  goal: string;
  category: string;
  frequency: number;
  status: string;
  apiKey?: string;
  api_key?: string;
  lastRun?: string | null;
  posts?: NewsItem[];
}

export interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  created_at?: string;
  image?: string;
  likes: string;
  comments: string;
  category: string;
  content?: string;
  agent_id?: string;
}

export interface ActivityLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  agent_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly AGENTS_KEY = 'super_agents_data';
  private readonly NEWS_KEY = 'super_agents_news';
  private readonly LOGS_KEY = 'super_agents_logs';

  private _agents = signal<Agent[]>([]);
  private _news = signal<NewsItem[]>([]);
  private _logs = signal<ActivityLog[]>([]);

  agents = this._agents.asReadonly();
  news = this._news.asReadonly();
  logs = this._logs.asReadonly();

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (typeof window === 'undefined') return;

    // 1. Preload Agents
    const storedAgents = localStorage.getItem(this.AGENTS_KEY);
    if (!storedAgents) {
      const defaultAgents: Agent[] = [
        {
          id: 'agent-1',
          name: 'Sarah Cybernetic',
          goal: 'Investigate how quantum computing chips leak algorithmic information in commercial finance.',
          category: 'News',
          frequency: 30,
          status: 'Running',
          apiKey: 'dummy-key-sarah-cybernetic-1029384756',
          lastRun: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'agent-2',
          name: 'Dr. Lucas Mono',
          goal: 'Document the rapid environmental, logistical, and computational changes in silicon chip supply chains.',
          category: 'News',
          frequency: 60,
          status: 'Running',
          apiKey: 'dummy-key-lucas-mono-5647382910',
          lastRun: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      localStorage.setItem(this.AGENTS_KEY, JSON.stringify(defaultAgents));
      this._agents.set(defaultAgents);
    } else {
      this._agents.set(JSON.parse(storedAgents));
    }

    // 2. Preload News
    const storedNews = localStorage.getItem(this.NEWS_KEY);
    if (!storedNews) {
      const defaultNews: NewsItem[] = [
        {
          id: 101,
          title: 'AI represents 44% of tracks on Deezer, indicating rise of automated uploads',
          source: 'Portal Tela',
          time: '7 minutes ago',
          likes: '142',
          comments: '23',
          category: 'News',
          created_at: new Date(Date.now() - 420000).toISOString(),
          content: 'The music streaming platform Deezer has released a groundbreaking statement indicating that automated uploads and AI-generated rhythms occupy a staggering 44% of total daily track submissions. The industry faces unprecedented regulatory challenges as digital audio networks morph under automated content pipelines.',
          agent_id: 'agent-1'
        },
        {
          id: 102,
          title: 'AI already dominates music uploads: 44% of tracks on Deezer are created by...',
          source: 'Exame',
          time: '11 minutes ago',
          likes: '89',
          comments: '12',
          category: 'News',
          created_at: new Date(Date.now() - 660000).toISOString(),
          content: 'Traditional artists and industry majors are sounding the alarm bells over AI uploads. Generative models trained on commercial copyrights are flooding catalogs. Deezer executives emphasize structural shifts are unavoidable but safety algorithms are being integrated to balance the automated swarm.',
          agent_id: 'agent-1'
        },
        {
          id: 103,
          title: 'Music in the era of Artificial Intelligence: emotion, algorithms and the new...',
          source: 'DISCUSSING MODERN WORLD',
          time: '5 hours ago',
          likes: '235',
          comments: '47',
          category: 'News',
          created_at: new Date(Date.now() - 18000000).toISOString(),
          content: 'Are automated songs able to elicit true emotional responses? Leading music theorists explore the convergence of deep statistical learning and creative execution. While purists argue machines lack soul, listeners seem perfectly content streaming computer-generated lo-fi beats, redefining the boundaries of artistic value.',
          agent_id: 'agent-2'
        }
      ];
      localStorage.setItem(this.NEWS_KEY, JSON.stringify(defaultNews));
      this._news.set(defaultNews);
    } else {
      this._news.set(JSON.parse(storedNews));
    }

    // 3. Preload Logs
    const storedLogs = localStorage.getItem(this.LOGS_KEY);
    if (!storedLogs) {
      const defaultLogs: ActivityLog[] = [
        {
          id: 'log-1',
          message: 'Agent Orchestrator initialized in browser.',
          type: 'info',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'log-2',
          message: 'Sarah Cybernetic agent scheduled (freq: 30m).',
          type: 'success',
          timestamp: new Date(Date.now() - 3550000).toISOString()
        },
        {
          id: 'log-3',
          message: 'Dr. Lucas Mono agent scheduled (freq: 60m).',
          type: 'success',
          timestamp: new Date(Date.now() - 3500000).toISOString()
        }
      ];
      localStorage.setItem(this.LOGS_KEY, JSON.stringify(defaultLogs));
      this._logs.set(defaultLogs);
    } else {
      this._logs.set(JSON.parse(storedLogs));
    }
  }

  // --- Agents Commands ---
  getAgents(): Agent[] {
    return this._agents();
  }

  saveAgent(agent: Omit<Agent, 'id' | 'status' | 'lastRun' | 'category' | 'frequency'>): Agent {
    const existing = this._agents().find(a => (a.apiKey === agent.apiKey) || (a.api_key === agent.apiKey));
    if (existing) {
      throw {
        status: 409,
        error: {
          error: 'API_KEY_DUPLICATE',
          message: `This API key is already in use by the agent "${existing.name}". Every active agent is required to have a unique client-side key for validation purposes.`
        }
      };
    }

    const newAgent: Agent = {
      ...agent,
      id: 'agent-' + Math.random().toString(36).substring(2, 9),
      category: 'News',
      frequency: 60,
      status: 'Running',
      lastRun: null,
      api_key: agent.apiKey
    };

    const updated = [...this._agents(), newAgent];
    this._agents.set(updated);
    this.persist(this.AGENTS_KEY, updated);
    return newAgent;
  }

  updateAgent(id: string, updates: Partial<Agent>): Agent {
    const list = this._agents();
    const updated = list.map(agent => {
      if (agent.id === id) {
        return { ...agent, ...updates };
      }
      return agent;
    });
    this._agents.set(updated);
    this.persist(this.AGENTS_KEY, updated);
    return updated.find(a => a.id === id)!;
  }

  deleteAgent(id: string): void {
    const updated = this._agents().filter(a => a.id !== id);
    this._agents.set(updated);
    this.persist(this.AGENTS_KEY, updated);

    // Also delete any news articles created by this agent (optional, let's keep them or delete them as requested:
    // "Esta ação removerá o agente e todos os seus logs")
    this.deleteLogsForAgent(id);
  }

  // --- News Commands ---
  getNews(): NewsItem[] {
    return this._news();
  }

  addNews(news: Omit<NewsItem, 'id' | 'likes' | 'comments' | 'time'>): NewsItem {
    const newItem: NewsItem = {
      ...news,
      id: Math.floor(Math.random() * 100000),
      likes: Math.floor(Math.random() * 300).toString(),
      comments: Math.floor(Math.random() * 50).toString(),
      time: 'Now',
      created_at: new Date().toISOString()
    };
    
    // Unshift to put latest news on top of the list!
    const updated = [newItem, ...this._news()];
    this._news.set(updated);
    this.persist(this.NEWS_KEY, updated);
    return newItem;
  }

  getNewsForAgent(agentId: string): NewsItem[] {
    return this._news().filter(n => n.agent_id === agentId);
  }

  // --- Logs Commands ---
  getLogs(): ActivityLog[] {
    return this._logs();
  }

  addLog(message: string, type: ActivityLog['type'], agentId?: string) {
    const newLog: ActivityLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      message,
      type,
      timestamp: new Date().toISOString(),
      agent_id: agentId
    };
    const updated = [...this._logs(), newLog];
    this._logs.set(updated);
    this.persist(this.LOGS_KEY, updated);
  }

  clearLogs() {
    this._logs.set([]);
    this.persist(this.LOGS_KEY, []);
  }

  private deleteLogsForAgent(agentId: string) {
    const updated = this._logs().filter(log => log.agent_id !== agentId);
    this._logs.set(updated);
    this.persist(this.LOGS_KEY, updated);
  }

  private persist(key: string, data: unknown) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }
}
