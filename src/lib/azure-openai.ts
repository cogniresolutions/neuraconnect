import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function sendMessageToAI(message: string) {
  try {
    console.log("Sending message to Edge Function:", message);
    
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { message }
    });

    if (error) {
      console.error("Supabase Function Error:", error);
      throw error;
    }

    console.log("Response from Edge Function:", data);
    return data;
  } catch (error) {
    console.error('Error calling Edge Function:', error);
    throw error;
  }
}