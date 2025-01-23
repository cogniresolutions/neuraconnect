import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Settings } from 'lucide-react';
import { PersonaForm } from './persona/PersonaForm';
import { PersonaList } from './persona/PersonaList';

const PersonaCreator = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personas, setPersonas] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const { data: personas, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonas(personas || []);
    } catch (error) {
      console.error('Error fetching personas:', error);
      toast({
        title: "Error",
        description: "Failed to load personas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-purple-200">Loading personas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-400">
            My Personas
          </h1>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Persona
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {isCreating ? (
          <PersonaForm
            onCancel={() => setIsCreating(false)}
            onSuccess={() => {
              setIsCreating(false);
              fetchPersonas();
              toast({
                title: "Success",
                description: "Persona created successfully!",
              });
            }}
          />
        ) : (
          <PersonaList
            personas={personas}
            onDelete={async (id) => {
              try {
                const { error } = await supabase
                  .from('personas')
                  .delete()
                  .eq('id', id);
                if (error) throw error;
                fetchPersonas();
                toast({
                  title: "Success",
                  description: "Persona deleted successfully!",
                });
              } catch (error) {
                console.error('Error deleting persona:', error);
                toast({
                  title: "Error",
                  description: "Failed to delete persona. Please try again.",
                  variant: "destructive",
                });
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PersonaCreator;