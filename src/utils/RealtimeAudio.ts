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
      console.log('Starting connection process...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Requesting WebSocket URL from realtime-chat function...');
      const { data, error } = await supabase.functions.invoke('realtime-chat', {
        body: { 
          persona: this.persona,
          userId: user.id
        }
      });

      if (error) {
        console.error('Error from realtime-chat function:', error);
        throw error;
      }
      
      if (!data.websocketUrl) {
        console.error('No WebSocket URL received:', data);
        throw new Error('Invalid response from server');
      }

      console.log('Connecting to WebSocket:', data.websocketUrl);
      this.socket = new WebSocket(data.websocketUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.sendSystemMessage();
      };

      this.socket.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message received:', event.data);
          const message = JSON.parse(event.data);
          console.log('Parsed message:', message);
          this.onMessage(message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.onMessage({ type: 'error', error });
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
      console.error('Connection error:', error);
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

    console.log('Sending system message:', systemMessage);
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

    console.log('Sending message:', message);
    this.socket.send(JSON.stringify(message));
  }

  disconnect() {
    console.log('Disconnecting WebSocket...');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}