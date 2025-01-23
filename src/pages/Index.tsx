import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PersonaCreator from "@/components/PersonaCreator";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to check authentication status",
          variant: "destructive",
        });
        return;
      }

      if (!session) {
        navigate("/auth");
      }
    };

    checkAuth();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <div className="flex items-center justify-center p-4">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475"
          alt="Neuraconnect Logo"
          className="w-12 h-12 object-cover rounded-lg shadow-lg animate-subtle-movement"
        />
      </div>
      <PersonaCreator />
    </div>
  );
};

export default Index;