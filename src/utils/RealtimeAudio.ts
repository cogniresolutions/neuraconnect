import { supabase } from "@/integrations/supabase/client";

export class RealtimeChat {
  private ws: WebSocket | null = null;
  private messageCallback: (event: any) => void;
  private context: any = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private persona: any;

  constructor(callback: (event: any) => void) {
    this.messageCallback = callback;
  }

  async init(persona: any) {
    try {
      this.persona = persona;
      console.log('Initializing chat with persona:', persona);
      
      const { data, error } = await supabase.functions.invoke('generate-chat-token', {
        body: { 
          personaId: persona.id,
          config: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality,
            skills: persona.skills,
            topics: persona.topics
          }
        }
      });

      if (error) {
        console.error('Error getting chat token:', error);
        throw error;
      }
      
      if (!data?.wsUrl) {
        console.error('No WebSocket URL received:', data);
        throw new Error('No WebSocket URL received');
      }

      console.log('Connecting to WebSocket:', data.wsUrl);
      
      this.setupWebSocket(data.wsUrl);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      throw error;
    }
  }

  private setupWebSocket(wsUrl: string) {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.sendPersonaConfig();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
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
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        setTimeout(() => this.setupWebSocket(wsUrl), 1000 * this.reconnectAttempts);
      } else {
        this.messageCallback({
          type: 'error',
          error: { message: 'WebSocket connection closed' }
        });
      }
    };
  }

  private sendPersonaConfig() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send persona config: WebSocket not connected');
      return;
    }

    const config = {
      type: 'config',
      persona: {
        id: this.persona.id,
        name: this.persona.name,
        voice: this.persona.voice_style,
        personality: this.persona.personality,
        skills: this.persona.skills,
        topics: this.persona.topics
      }
    };

    console.log('Sending persona config:', config);
    this.ws.send(JSON.stringify(config));
  }

  updateContext(newContext: any) {
    this.context = { ...this.context, ...newContext };
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Updating context:', this.context);
      this.ws.send(JSON.stringify({
        type: 'context.update',
        context: this.context
      }));
    }
  }

  sendMessage(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      this.messageCallback({
        type: 'error',
        error: { message: 'WebSocket not connected' }
      });
      return;
    }

    try {
      const payload = { 
        type: 'message', 
        content: message,
        context: this.context 
      };
      console.log('Sending message:', payload);
      this.ws.send(JSON.stringify(payload));
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageCallback({
        type: 'error',
        error: { message: 'Failed to send message' }
      });
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}