import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TestResult {
  service: string;
  status: 'success' | 'error';
  error?: string;
}

export default function AzureTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const testAzureServices = async () => {
    setIsLoading(true);
    setResults([]);
    try {
      console.log('Starting Azure services test...');
      const { data, error } = await supabase.functions.invoke('test-azure', {
        body: { test: 'all' }
      });

      console.log('Edge Function Response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.results) {
        setResults(data.results);
        const hasErrors = data.results.some((result: TestResult) => result.status === 'error');
        
        toast({
          title: hasErrors ? 'Test Completed with Errors' : 'Test Completed Successfully',
          description: hasErrors 
            ? 'Some Azure services are not working correctly. Check the results below.'
            : 'All Azure services are working correctly.',
          variant: hasErrors ? 'destructive' : 'default',
        });
      }
    } catch (error) {
      console.error('Error testing Azure services:', error);
      toast({
        title: 'Error',
        description: 'Failed to test Azure services: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-black/95 text-white rounded-lg">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Azure Services Test</h2>
        <p className="text-sm text-gray-400">
          Click the button below to test Azure services connectivity.
        </p>
        <Button 
          onClick={testAzureServices}
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
            'Test Azure Services'
          )}
        </Button>
      </div>
      
      {results.length > 0 && (
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg ${
                  result.status === 'success' 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.service}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.status === 'success' 
                      ? 'bg-green-500/30 text-green-300' 
                      : 'bg-red-500/30 text-red-300'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                {result.error && (
                  <p className="mt-2 text-sm text-red-300">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}