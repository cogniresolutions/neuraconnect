import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  service: string;
  status: string;
  statusCode?: number;
  error?: string;
}

export default function AzureTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runTest = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Azure services test...');
      const { data, error } = await supabase.functions.invoke('test-azure');
      
      console.log('Test response:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: 'Error',
          description: 'Failed to test Azure services: ' + error.message,
          variant: 'destructive',
        });
        return;
      }

      if (!data?.results) {
        console.error('Invalid response format:', data);
        toast({
          title: 'Error',
          description: 'Invalid response from Azure services test',
          variant: 'destructive',
        });
        return;
      }

      setTestResults(data.results);
      
      const hasErrors = data.results.some(result => result.status === 'error');
      toast({
        title: hasErrors ? 'Warning' : 'Success',
        description: hasErrors 
          ? 'Some Azure services tests failed' 
          : 'All Azure services tests completed successfully',
        variant: hasErrors ? 'destructive' : 'default',
      });
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
        <Button 
          onClick={runTest}
          variant="outline"
          className="bg-white/10 text-white hover:bg-white/20"
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test Azure Services'}
        </Button>
      </div>
      
      {testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((result, index) => (
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
                {result.statusCode && (
                  <span className="text-sm text-gray-400">
                    (Code: {result.statusCode})
                  </span>
                )}
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