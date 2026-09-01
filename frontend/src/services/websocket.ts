type MessageHandler = (data: any) => void;

export class RealTimeQueueClient {
  private ws: WebSocket | null = null;
  private channel: string;
  private listeners: Set<MessageHandler> = new Set();
  private reconnectTimer: number | null = null;

  constructor(channel: string = 'global') {
    this.channel = channel;
  }

  public connect() {
    const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws';
    const url = `${wsBase}/${encodeURIComponent(this.channel)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`[WS] Connected to channel: ${this.channel}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(parsed));
        } catch {
          this.listeners.forEach((listener) => listener(event.data));
        }
      };

      this.ws.onclose = () => {
        console.log(`[WS] Disconnected from channel: ${this.channel}`);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn(`[WS] Error:`, err);
        this.ws?.close();
      };
    } catch (e) {
      console.error(`[WS] Connection failed:`, e);
      this.scheduleReconnect();
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
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 3000);
    }
  }
}
