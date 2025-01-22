import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/create-persona");
      }
    });
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-chatgpt-sidebar p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-8">Welcome to Persona Creator</h1>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          <Globe className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
};

export default Auth;