import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AzureSpeechTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing Azure Speech Services connection...');
      
      const { data, error: functionError } = await supabase.functions.invoke('azure-auth-test', {
        body: { 
          test: "speech"
        }
      });

      console.log('Azure Speech Services Response:', data);

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Error calling Azure Speech Services');
      }

      if (!data) {
        throw new Error('No response received from Azure Speech Services');
      }

      const speechTest = data.results.find((r: any) => r.service === 'Speech Services');
      
      if (speechTest?.status === 'error') {
        throw new Error(speechTest.error || 'Speech Services validation failed');
      }

      toast({
        title: "Connection Successful",
        description: "Successfully connected to Azure Speech Services",
      });

    } catch (error: any) {
      console.error('Azure Speech test error:', error);
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
        <h1 className="text-2xl font-bold text-center">Azure Speech Services Test</h1>
        <p className="text-center text-gray-600">
          Click the button below to test the Azure Speech Services connection
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
            'Test Azure Speech Services Connection'
          )}
        </Button>
      </div>
    </div>
  );
};

export default AzureSpeechTest;