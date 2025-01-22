import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PersonaList from "@/components/PersonaList";
import { Building2, Plus, UserCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#221F26]/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#9b87f5]" />
            <span className="text-xl font-semibold">Persona Creator</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleSignOut}
            >
              <UserCircle2 className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Your Personas</h1>
            <p className="text-gray-400">Create and manage your AI personas</p>
          </div>
          <Button
            onClick={() => navigate("/create-persona")}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Persona
          </Button>
        </div>

        {/* Personas List */}
        <div className="rounded-lg border border-gray-800 bg-[#221F26] p-6">
          <PersonaList />
        </div>
      </main>
    </div>
  );
};

export default Index;