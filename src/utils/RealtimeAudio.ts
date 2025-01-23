export class RealtimeChat {
  private ws: WebSocket | null = null;
  private messageCallback: (event: any) => void;
  private context: any = {};

  constructor(callback: (event: any) => void) {
    this.messageCallback = callback;
  }

  async init(persona: any) {
    try {
      console.log('Initializing chat with persona:', persona);
      
      // Get chat token from our Supabase function
      const { data, error } = await supabase.functions.invoke('generate-chat-token', {
        body: { personaId: persona.id }
      });

      if (error) throw error;
      if (!data?.wsUrl) throw new Error('No WebSocket URL received');

      console.log('Connecting to WebSocket:', data.wsUrl);
      
      this.ws = new WebSocket(data.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        // Send initial persona config
        this.ws.send(JSON.stringify({
          type: 'config',
          persona: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality,
            skills: persona.skills,
            topics: persona.topics
          }
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageCallback(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.messageCallback({
          type: 'error',
          error: { message: 'WebSocket connection error' }
        });
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.messageCallback({
          type: 'error',
          error: { message: 'WebSocket connection closed' }
        });
      };

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      throw error;
    }
  }

  updateContext(newContext: any) {
    this.context = { ...this.context, ...newContext };
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'context.update',
        context: this.context
      }));
    }
  }

  sendMessage(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      this.messageCallback({
        type: 'error',
        error: { message: 'WebSocket not connected' }
      });
      return;
    }

    try {
      this.ws.send(JSON.stringify({ 
        type: 'message', 
        content: message,
        context: this.context 
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageCallback({
        type: 'error',
        error: { message: 'Failed to send message' }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}