import { supabase } from '@/integrations/supabase/client';

export const cleanupUserSessions = async (userId?: string | null) => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) return;

    const { error } = await supabase
      .from('tavus_sessions')
      .update({
        status: 'ended',
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error cleaning up sessions:', error);
      throw error;
    }

    console.log('Successfully cleaned up sessions for user:', userId);
  } catch (error) {
    console.error('Error in cleanupUserSessions:', error);
    throw error;
  }
};