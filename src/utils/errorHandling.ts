import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface APIError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

export async function logAPIUsage(endpoint: string, status: string, error?: Error, responseTime?: number) {
  try {
    const { error: dbError } = await supabase
      .from('api_monitoring')
      .insert({
        endpoint,
        status,
        error_message: error?.message,
        response_time: responseTime,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (dbError) {
      console.error('Error logging API usage:', dbError);
    }
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

export function handleAPIError(error: APIError, context: string) {
  console.error(`${context} error:`, error);
  
  const errorMessage = error.message || 'An unexpected error occurred';
  
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });

  return errorMessage;
}

export function measureResponseTime() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}