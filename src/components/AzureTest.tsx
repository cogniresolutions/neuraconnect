import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AzureTest() {
  const [testResults, setTestResults] = useState<string>('');
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

      setTestResults(JSON.stringify(data, null, 2));
      
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
      
      {testResults && (
        <pre className="p-4 bg-gray-100 rounded-lg overflow-auto max-h-96">
          {testResults}
        </pre>
      )}
    </div>
  );
}