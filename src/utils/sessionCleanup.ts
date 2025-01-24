import { supabase } from '@/integrations/supabase/client';

export const cleanupUserSessions = async (userId?: string | null) => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      console.log('No user ID provided for cleanup');
      return;
    }

    console.log('Cleaning up sessions for user:', userId);

    // First, end all active sessions for this user
    const { error: updateError } = await supabase
      .from('tavus_sessions')
      .update({
        status: 'ended',
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      throw updateError;
    }

    // Then, clean up any sessions where this user is in the participants array
    // Using proper JSON containment operator
    const { data: sessions, error: fetchError } = await supabase
      .from('tavus_sessions')
      .select('id')
      .eq('is_active', true)
      .contains('participants', [{ user_id: userId, type: 'user' }]);

    if (fetchError) {
      console.error('Error fetching sessions:', fetchError);
      throw fetchError;
    }

    if (sessions && sessions.length > 0) {
      const { error: participantUpdateError } = await supabase
        .from('tavus_sessions')
        .update({
          status: 'ended',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', sessions.map(s => s.id));

      if (participantUpdateError) {
        console.error('Error updating participant sessions:', participantUpdateError);
        throw participantUpdateError;
      }
    }

    console.log('Successfully cleaned up sessions for user:', userId);
  } catch (error) {
    console.error('Error in cleanupUserSessions:', error);
    throw error;
  }
};