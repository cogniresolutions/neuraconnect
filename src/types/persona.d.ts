export type Persona = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  voice_style: string;
  updated_at: string;
  profile_picture_url?: string;
};