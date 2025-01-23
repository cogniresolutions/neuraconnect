import { supabase } from "@/integrations/supabase/client";

interface RealtimeChatOptions {
  onMessage: (message: any) => void;
  persona: any;
}

export class RealtimeChat {
  private socket: WebSocket | null = null;
  private onMessage: (message: any) => void;
  private persona: any;

  constructor(options: RealtimeChatOptions) {
    this.onMessage = options.onMessage;
    this.persona = options.persona;
  }

  async connect() {
    try {
      console.log('Connecting to chat server...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('realtime-chat', {
        body: { 
          action: 'connect',
          personaId: this.persona.id,
          userId: user.id
        }
      });

      if (error) throw error;
      
      const wsUrl = data.websocketUrl;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.sendSystemMessage();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onMessage({ type: 'error', error });
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
      };

    } catch (error) {
      console.error('Error connecting to chat:', error);
      throw error;
    }
  }

  private sendSystemMessage() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send system message: WebSocket not connected');
      return;
    }

    const systemMessage = {
      type: 'input_text',
      role: 'system',
      content: `You are ${this.persona.name}. ${this.persona.personality || ''}`,
    };

    this.socket.send(JSON.stringify(systemMessage));
  }

  sendMessage(text: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    const message = {
      type: 'input_text',
      role: 'user',
      content: text,
    };

    this.socket.send(JSON.stringify(message));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}