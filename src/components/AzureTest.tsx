import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TestResult {
  service: string;
  status: string;
  error?: string;
}

export default function AzureTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const testAzureAuth = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      console.log('Starting Azure authentication test...');
      const { data, error } = await supabase.functions.invoke('azure-auth-test');

      console.log('Edge Function Response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: 'Error',
          description: 'Failed to test Azure authentication: ' + error.message,
          variant: 'destructive',
        });
        return;
      }

      if (!data?.results) {
        console.error('Invalid response format:', data);
        toast({
          title: 'Error',
          description: 'Invalid response from Azure authentication test',
          variant: 'destructive',
        });
        return;
      }

      setResults(data.results);
      
      const hasErrors = data.results.some(result => result.status === 'error');
      toast({
        title: hasErrors ? 'Warning' : 'Success',
        description: hasErrors 
          ? 'Some Azure services are not properly configured' 
          : 'Azure authentication test completed successfully',
        variant: hasErrors ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Error testing Azure auth:', error);
      toast({
        title: 'Error',
        description: 'Failed to test Azure authentication: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-black/95 text-white rounded-lg">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Azure OpenAI Test</h2>
        <p className="text-sm text-gray-400">
          Click the button below to verify Azure OpenAI credentials and service connectivity.
        </p>
        <Button 
          onClick={testAzureAuth}
          variant="outline"
          className="bg-white/10 text-white hover:bg-white/20"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Azure OpenAI Services'
          )}
        </Button>
      </div>
      
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <h3 className="text-lg font-semibold">{result.service}</h3>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm">Status: </span>
                <span className={`text-sm font-medium ${
                  result.status === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.status}
                </span>
              </div>
              {result.error && (
                <p className="mt-2 text-sm text-red-400">
                  Error: {result.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}