import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Video, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ConversationSetup = () => {
  const { toast } = useToast();
  const [context, setContext] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const startConversation = async () => {
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-conversation', {
        body: { context }
      });

      if (error) throw error;

      toast({
        title: "Conversation Started",
        description: "Your conversation has been initialized successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Conversation Context (Optional)
          </label>
          <Textarea
            placeholder="Enter any specific context or scenario for this conversation..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={startConversation}
          disabled={isStarting}
          className="flex-1"
        >
          <Video className="w-4 h-4 mr-2" />
          Start Video Call
        </Button>
        <Button variant="outline" className="flex-1">
          <MessageSquare className="w-4 h-4 mr-2" />
          Start Chat
        </Button>
      </div>
    </div>
  );
};

export default ConversationSetup;