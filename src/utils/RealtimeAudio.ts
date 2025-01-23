export class RealtimeChat {
  private ws: WebSocket | null = null;
  private messageCallback: (event: any) => void;
  private context: any = {};

  constructor(callback: (event: any) => void) {
    this.messageCallback = callback;
  }

  async init(persona: any) {
    const response = await fetch("https://api.example.com/realtime-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ persona }),
    });

    if (!response.ok) {
      throw new Error("Failed to initialize chat");
    }

    const { wsUrl } = await response.json();
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      this.messageCallback(JSON.parse(event.data));
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
  }

  updateContext(newContext: any) {
    this.context = { ...this.context, ...newContext };
    // Send updated context to the server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'context.update',
        context: this.context
      }));
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', content: message }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
