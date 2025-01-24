import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PersonaCreator from "@/components/PersonaCreator";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth check error:", error);
          toast({
            title: "Error",
            description: "Failed to check authentication status",
            variant: "destructive",
          });
          return;
        }

        if (!session) {
          console.log("No session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error during auth check:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    };

    // Check auth on mount
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

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