import { Injectable, signal, computed } from '@angular/core';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  agentId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private _logs = signal<LogEntry[]>([]);
  
  logs = computed(() => [...this._logs()].reverse());

  addLog(message: string, type: LogEntry['type'] = 'info', agentId?: string) {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      message,
      type,
      agentId
    };
    
    this._logs.update(logs => [...logs, newEntry]);
    
    if (this._logs().length > 100) {
      this._logs.update(logs => logs.slice(1));
    }
  }

  clearLogs() {
    this._logs.set([]);
  }
}
