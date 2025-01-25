export interface Persona {
  id: string;
  name: string;
  description?: string | null;
  voice_style?: string | null;
  profile_picture_url?: string | null;
  video_url?: string | null;
  personality?: string | null;
  skills?: string[];
  topics?: string[];
  status?: 'draft' | 'ready' | 'pending' | null;
  model_config?: {
    model: string;
    max_tokens: number;
    temperature: number;
    voice?: string;
  };
}