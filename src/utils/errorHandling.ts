import { supabase } from '@/integrations/supabase/client';

export interface APIError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

export async function logAPIUsage(
  endpoint: string, 
  status: 'success' | 'error', 
  error?: Error | null,
  responseTime?: number
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Format the message for better readability in notifications
    let formattedMessage = '';
    if (endpoint === 'delete-persona') {
      formattedMessage = status === 'success' 
        ? `Successfully deleted persona (${responseTime}ms)`
        : `Failed to delete persona: ${error?.message || 'Unknown error'}`;
    }

    const { error: dbError } = await supabase
      .from('api_monitoring')
      .insert({
        endpoint,
        status,
        error_message: formattedMessage || error?.message,
        response_time: responseTime,
        user_id: user?.id
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
  
  // Log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  
  return error.message || 'An unexpected error occurred';
}

export function measureResponseTime() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}