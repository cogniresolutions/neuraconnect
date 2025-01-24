import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  service: string;
  status: string;
  statusCode?: number;
  error?: string;
}

const AzureSpeechTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [allSuccess, setAllSuccess] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setAllSuccess(false);
    
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

      setResults(data.results);

      // Check if all tests passed
      const allPassed = data.results.every((result: TestResult) => result.status === 'success');
      setAllSuccess(allPassed);

      if (allPassed) {
        toast({
          title: "All Services Connected",
          description: "Successfully connected to all Azure services",
        });
      } else {
        const failedServices = data.results.filter((r: TestResult) => r.status === 'error');
        throw new Error(`Failed services: ${failedServices.map(s => s.service).join(', ')}`);
      }

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
        <h1 className="text-2xl font-bold text-center">Azure Services Test</h1>
        <p className="text-center text-gray-600">
          Click the button below to test all Azure services connections
        </p>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded border transition-colors ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {result.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={result.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                    {result.service}
                  </span>
                </div>
                <span className={`text-sm ${
                  result.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.status === 'success' ? 'Connected' : result.error || 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}

        {allSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 ml-2">
              All Azure services are connected and working perfectly!
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={testConnection}
          disabled={isLoading}
          className={`w-full ${allSuccess ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connections...
            </>
          ) : allSuccess ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              All Services Verified
            </>
          ) : (
            'Test Azure Services Connection'
          )}
        </Button>
      </div>
    </div>
  );
};

export default AzureSpeechTest;