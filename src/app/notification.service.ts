import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _notifications = signal<Notification[]>([]);
  notifications = this._notifications.asReadonly();

  show(message: string, type: Notification['type'] = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif: Notification = { id, message, type };
    this._notifications.update(prev => [...prev, newNotif]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      this.dismiss(id);
    }, 4000);
  }

  dismiss(id: string) {
    this._notifications.update(prev => prev.filter(n => n.id !== id));
  }
}
