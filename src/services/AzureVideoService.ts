import { supabase } from "@/integrations/supabase/client";

class AzureVideoService {
  private static instance: AzureVideoService;
  private videoElement: HTMLVideoElement | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): AzureVideoService {
    if (!AzureVideoService.instance) {
      AzureVideoService.instance = new AzureVideoService();
    }
    return AzureVideoService.instance;
  }

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    await this.connectToStream();
  }

  private async getStreamUrl(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('get-azure-stream-url', {
        body: { context: 'video_call' }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error getting Azure stream URL:', error);
      throw error;
    }
  }

  private async connectToStream(): Promise<void> {
    if (!this.videoElement) {
      throw new Error('Video element not initialized');
    }

    try {
      const streamUrl = await this.getStreamUrl();
      this.videoElement.src = streamUrl;
      await this.videoElement.play();
      this.reconnectAttempts = 0;
      console.log('Azure video stream connected successfully');
    } catch (error) {
      console.error('Error connecting to Azure stream:', error);
      this.handleStreamError();
    }
  }

  private handleStreamError(): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connectToStream();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      throw new Error('Failed to connect to Azure video stream');
    }
  }

  cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement = null;
    }
    
    this.reconnectAttempts = 0;
  }
}

export default AzureVideoService;