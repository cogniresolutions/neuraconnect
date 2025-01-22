import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PersonaList } from "@/components/PersonaList";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (session) {
        navigate("/create-persona");
      }
    });

    // Check for any error parameters in the URL
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (error) {
      console.error("Auth error:", error, errorDescription);
      toast({
        title: "Authentication Error",
        description: errorDescription || "There was an error during authentication",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const handleGoogleSignIn = async () => {
    try {
      const redirectURL = `${window.location.origin}/auth`;
      console.log("Redirect URL:", redirectURL);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectURL,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      console.log("Sign in attempt:", { data, error });
      
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Sign in error caught:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="bg-chatgpt-sidebar p-8 rounded-lg shadow-lg w-full max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold text-white text-center">Welcome to Persona Creator</h1>
        
        <div className="space-y-6">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-white text-black hover:bg-gray-100"
            onClick={handleGoogleSignIn}
          >
            <Globe className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <p className="text-sm text-gray-400 text-center">
            Sign in to create and manage your personas
          </p>
        </div>

        <PersonaList />
      </div>
    </div>
  );
};

export default Auth;