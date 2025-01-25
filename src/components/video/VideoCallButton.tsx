import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Video, Loader2 } from 'lucide-react';
import { ConsentDialog } from './ConsentDialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface VideoCallButtonProps {
  personaId: string;
  personaName: string;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({ personaId, personaName }) => {
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartCall = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to start a video call",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Initialize video call session
      const { data, error } = await supabase.functions.invoke('video-call', {
        body: {
          action: 'start',
          personaId,
          userId: user.id
        }
      });

      if (error) throw error;

      // Navigate to video call page
      navigate(`/video-call/${personaId}`);

      toast({
        title: "Video Call Initialized",
        description: `Starting call with ${personaName}`,
      });

    } catch (error: any) {
      console.error('Error starting video call:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start video call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConsentDialog(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowConsentDialog(true)}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            Start Video Call
          </>
        )}
      </Button>

      <ConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onAccept={handleStartCall}
        personaName={personaName}
      />
    </>
  );
};