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
          src="https://images.unsplash.com/photo-1676299081847-824916de030a"
          alt="Neuraconnect Logo"
          className="w-16 h-16 object-cover rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-transform duration-300 hover:scale-105 border-2 border-[#9b87f5]/30"
        />
      </div>
      <PersonaCreator />
    </div>
  );
};

export default Index;