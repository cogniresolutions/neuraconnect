import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AzureTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('azure-chat', {
        body: { 
          text: "Hello! This is a test message.",
          persona: {
            name: "Test Assistant",
            personality: "helpful and friendly",
            skills: ["testing", "conversation"],
            topics: ["general knowledge"]
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Connection Successful",
        description: data.text,
      });

      console.log('Azure OpenAI Response:', data);

    } catch (error: any) {
      console.error('Azure test error:', error);
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Azure OpenAI Test</h1>
        <p className="text-center text-gray-600">
          Click the button below to test the Azure OpenAI connection
        </p>
        <Button
          onClick={testConnection}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test Azure OpenAI Connection'
          )}
        </Button>
      </div>
    </div>
  );
};

export default AzureTest;