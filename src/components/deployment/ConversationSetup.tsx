import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Video, MessageSquare, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ConversationSetup = () => {
  const { toast } = useToast();
  const [context, setContext] = useState('');
  const [conversationUrl, setConversationUrl] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const startConversation = async () => {
    setIsStarting(true);
    try {
      const conversationId = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('create-conversation', {
        body: { 
          conversationId,
          context,
          maxSessions: 5
        }
      });

      if (error) throw error;

      const url = `${window.location.origin}/conversations/${conversationId}`;
      setConversationUrl(url);

      toast({
        title: "Conversation Created",
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

  const copyUrl = () => {
    navigator.clipboard.writeText(conversationUrl);
    toast({
      title: "URL Copied",
      description: "Conversation URL has been copied to clipboard.",
    });
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

        {conversationUrl && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Conversation URL:</p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyUrl}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(conversationUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600 break-all">{conversationUrl}</p>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          onClick={startConversation}
          disabled={isStarting}
          className="flex-1"
        >
          <Video className="w-4 h-4 mr-2" />
          Create New Conversation
        </Button>
      </div>
    </div>
  );
};

export default ConversationSetup;