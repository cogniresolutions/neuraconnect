import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Key, Trash2, Copy, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface APIKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

const APIKeyManager = () => {
  const { toast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error Loading API Keys",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setKeys(data || []);
  };

  const generateAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-api-key', {
        body: { name: newKeyName }
      });

      if (error) throw error;

      toast({
        title: "API Key Generated",
        description: "Your new API key has been created successfully.",
      });

      setNewKeyName('');
      loadAPIKeys();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);

    if (error) {
      toast({
        title: "Error Deleting API Key",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "API Key Deleted",
      description: "The API key has been deleted successfully.",
    });

    loadAPIKeys();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Input
          placeholder="Enter API key name"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={generateAPIKey}
          disabled={isLoading || !newKeyName.trim()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Key
        </Button>
      </div>

      <div className="space-y-4">
        {keys.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <Key className="w-4 h-4" />
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(key.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAPIKey(key.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default APIKeyManager;