import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AzureTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    
    try {
      console.log('Testing Azure OpenAI connection...');
      
      const { data, error: functionError } = await supabase.functions.invoke('azure-chat', {
        body: { 
          message: "Hello! This is a test message.",
          persona: {
            name: "Test Assistant",
            personality: "helpful and friendly",
            skills: ["testing", "conversation"],
            topics: ["general knowledge"]
          }
        }
      });

      console.log('Azure OpenAI Response:', data);

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Error calling Azure OpenAI');
      }

      if (!data) {
        throw new Error('No response received from Azure OpenAI');
      }

      setIsSuccess(true);
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Azure OpenAI",
      });

    } catch (error: any) {
      console.error('Azure test error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Connection Error",
        description: errorMessage,
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
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 ml-2">
              Azure OpenAI connection is working perfectly!
            </AlertDescription>
          </Alert>
        )}
        <Button
          onClick={testConnection}
          disabled={isLoading}
          className={`w-full ${isSuccess ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Connection Verified
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