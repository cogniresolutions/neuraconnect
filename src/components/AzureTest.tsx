import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AzureTest = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-azure');
      if (error) throw error;
      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Button onClick={runTest} disabled={loading}>
        {loading ? 'Testing...' : 'Test Azure Services'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-2">
          {results.map((result: any, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="font-medium">{result.service}</h3>
              <p className="text-sm">
                Status: {result.status}
                {result.error && ` - Error: ${result.error}`}
                {result.statusCode && ` (Code: ${result.statusCode})`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AzureTest;