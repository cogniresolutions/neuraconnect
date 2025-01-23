import { AudioRecorder } from './AudioRecorder';
import { WebRTCManager } from './WebRTCManager';

export class RealtimeChat {
  private webrtc: WebRTCManager | null = null;
  private recorder: AudioRecorder | null = null;

  constructor(
    private onMessage: (message: any) => void,
    private persona: any
  ) {}

  async init() {
    try {
      this.webrtc = new WebRTCManager(this.onMessage, this.persona);
      await this.webrtc.initialize();

      this.recorder = new AudioRecorder((audioData) => {
        this.webrtc?.sendMessage(audioData);
      });
      await this.recorder.start();

    } catch (error) {
      console.error("Error initializing chat:", error);
      this.cleanup();
      throw error;
    }
  }

  async sendMessage(text: string) {
    this.webrtc?.sendMessage(text);
  }

  disconnect() {
    this.cleanup();
  }

  private cleanup() {
    this.recorder?.stop();
    this.webrtc?.cleanup();
    this.recorder = null;
    this.webrtc = null;
  }
}