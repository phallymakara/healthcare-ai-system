import { getWsBase } from './api';

type MessageHandler = (data: any) => void;

export class RealTimeQueueClient {
  private ws: WebSocket | null = null;
  private channel: string;
  private listeners: Set<MessageHandler> = new Set();
  private reconnectTimer: number | null = null;
  private isExplicitlyClosed: boolean = false;

  constructor(channel: string = 'global') {
    this.channel = channel;
  }

  public connect() {
    this.isExplicitlyClosed = false;
    const wsBase = getWsBase();
    const url = `${wsBase}/${encodeURIComponent(this.channel)}`;

    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        if (this.isExplicitlyClosed) {
          socket.close();
          return;
        }
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(parsed));
        } catch {
          this.listeners.forEach((listener) => listener(event.data));
        }
      };

      socket.onclose = () => {
        this.ws = null;
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      socket.onerror = () => {
        if (!this.isExplicitlyClosed && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch {
      if (!this.isExplicitlyClosed) {
        this.scheduleReconnect();
      }
    }
  }

  public subscribe(handler: MessageHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => socket.close();
      }
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed) return;
    if (!this.reconnectTimer) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        if (!this.isExplicitlyClosed) {
          this.connect();
        }
      }, 3000);
    }
  }
}
