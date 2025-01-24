import { supabase } from '@/integrations/supabase/client';

export const cleanupUserSessions = async (sessionId?: string | null) => {
  try {
    if (!sessionId) {
      console.log('No session ID provided for cleanup');
      return;
    }

    console.log('Cleaning up session:', sessionId);

    // Update the specific session
    const { error: updateError } = await supabase
      .from('tavus_sessions')
      .update({
        status: 'ended',
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      throw updateError;
    }

    console.log('Successfully cleaned up session:', sessionId);
  } catch (error) {
    console.error('Error in cleanupUserSessions:', error);
    throw error;
  }
};