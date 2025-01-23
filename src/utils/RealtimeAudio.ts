import { supabase } from "@/integrations/supabase/client";

interface MessageHandler {
  (event: any): void;
}

export class RealtimeChat {
  private socket: WebSocket | null = null;
  private messageHandler: MessageHandler;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private accessToken: string | null = null;
  private clientSecret: string | null = null;

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
      
      this.accessToken = session.access_token;
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
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (error) throw error;
      if (!data?.client_secret) throw new Error('No client secret received');

      this.clientSecret = data.client_secret;
      console.log('Successfully received chat token');

      await this.establishWebSocketConnection();

    } catch (error) {
      console.error('Error initializing chat:', error);
      this.messageHandler({
        type: 'error',
        error: error instanceof Error ? error : new Error('Failed to initialize chat')
      });
      throw error;
    }
  }

  private async establishWebSocketConnection() {
    if (!this.accessToken || !this.clientSecret) {
      throw new Error('Missing authentication credentials');
    }

    // Initialize WebSocket connection
    // Construct the URL with authentication parameters properly encoded
    const wsUrl = `wss://api.openai.com/v1/realtime?auth=${encodeURIComponent(this.accessToken)}&secret=${encodeURIComponent(this.clientSecret)}`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.authenticate();
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
        setTimeout(() => this.establishWebSocketConnection(), 1000 * Math.pow(2, this.reconnectAttempts));
      } else {
        this.messageHandler({
          type: 'error',
          error: new Error('WebSocket connection closed')
        });
      }
    };
  }

  private authenticate() {
    if (!this.socket || !this.accessToken || !this.clientSecret) {
      console.error('Cannot authenticate: missing credentials or socket connection');
      return;
    }

    const authMessage = {
      type: 'auth',
      client_secret: this.clientSecret,
      access_token: this.accessToken
    };

    console.log('Sending authentication message');
    this.socket.send(JSON.stringify(authMessage));
  }

  sendMessage(content: string | number[]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      const message = typeof content === 'string' 
        ? { 
            type: 'text', 
            content,
            access_token: this.accessToken
          }
        : { 
            type: 'audio', 
            content,
            access_token: this.accessToken
          };
      
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
        context,
        access_token: this.accessToken
      }));
    } catch (error) {
      console.error('Error updating context:', error);
    }
  }
}