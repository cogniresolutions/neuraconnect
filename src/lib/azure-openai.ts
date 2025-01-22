import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function sendMessageToAI(message: string) {
  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { message }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error calling Azure OpenAI:', error);
    throw error;
  }
}