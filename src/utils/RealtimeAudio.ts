import { supabase } from "@/integrations/supabase/client";

interface MessageHandler {
  (event: any): void;
}

export class RealtimeChat {
  private socket: WebSocket | null = null;
  private messageHandler: MessageHandler;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor(messageHandler: MessageHandler) {
    this.messageHandler = messageHandler;
    console.log('RealtimeChat initialized with message handler');
  }

  async init(persona: any) {
    try {
      console.log('Initializing chat with persona:', persona);
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      console.log('Session retrieved successfully:', session.user?.id);

      // Get chat token from Supabase function
      const { data, error } = await supabase.functions.invoke('generate-chat-token', {
        body: { 
          personaId: persona.id,
          config: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality,
            skills: persona.skills || [],
            topics: persona.topics || []
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (!data?.client_secret) throw new Error('No client secret received');

      console.log('Successfully received chat token');

      // Initialize WebSocket connection with authentication
      this.socket = new WebSocket('wss://api.openai.com/v1/realtime');
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        if (this.socket) {
          this.socket.send(JSON.stringify({
            type: 'auth',
            client_secret: data.client_secret,
            access_token: session.access_token // Include access token for authentication
          }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          this.messageHandler(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.messageHandler({
            type: 'error',
            error: new Error('Failed to parse WebSocket message')
          });
        }
      };

      this.socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        this.messageHandler({
          type: 'error',
          error: new Error('WebSocket connection error')
        });
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          console.log('Attempting to reconnect...');
          this.reconnectAttempts++;
          setTimeout(() => this.init(persona), 1000 * this.reconnectAttempts);
        } else {
          this.messageHandler({
            type: 'error',
            error: new Error('WebSocket connection closed')
          });
        }
      };

    } catch (error) {
      console.error('Error initializing chat:', error);
      this.messageHandler({
        type: 'error',
        error: error instanceof Error ? error : new Error('Failed to initialize chat')
      });
      throw error;
    }
  }

  sendMessage(content: string | number[]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      const message = typeof content === 'string' 
        ? { type: 'text', content }
        : { type: 'audio', content };
      
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageHandler({
        type: 'error',
        error: new Error('Failed to send message')
      });
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  updateContext(context: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      this.socket.send(JSON.stringify({
        type: 'context',
        context
      }));
    } catch (error) {
      console.error('Error updating context:', error);
    }
  }
}