import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PersonaCreator from "@/components/PersonaCreator";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

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
      <NotificationCenter />
      <div className="flex items-center justify-center p-4">
        <img
          src="/lovable-uploads/e8089c0d-a187-4542-ba87-883bcc8ecd77.png"
          alt="Neuraconnect Logo"
          className="w-20 h-20 object-contain rounded-full shadow-[0_0_20px_rgba(56,182,255,0.4)] transition-transform duration-300 hover:scale-105 border-2 border-[#38b6ff]/30"
        />
      </div>
      <PersonaCreator />
    </div>
  );
};

export default Index;