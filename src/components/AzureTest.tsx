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
  const { toast } = useToast();

  const runTest = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('test-azure');
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to test Azure services',
          variant: 'destructive',
        });
        return;
      }

      setTestResults(data.results);
      
      toast({
        title: 'Success',
        description: 'Azure services test completed',
      });
    } catch (error) {
      console.error('Error testing Azure services:', error);
      toast({
        title: 'Error',
        description: 'Failed to test Azure services',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={runTest}>
        Test Azure Services
      </Button>
      
      {testResults.length > 0 && (
        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="font-medium text-gray-900">{result.service}</h3>
              <div className="mt-1 text-sm">
                <span className={`font-medium ${
                  result.status === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  Status: {result.status}
                </span>
                {result.statusCode && (
                  <span className="ml-2 text-gray-600">
                    (Code: {result.statusCode})
                  </span>
                )}
                {result.error && (
                  <p className="mt-1 text-red-600">Error: {result.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}