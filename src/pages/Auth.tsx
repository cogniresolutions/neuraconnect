import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Active session found:", session);
        window.location.href = '/';
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Success",
          description: "Successfully logged in!",
        });
        // Force a complete page reload to ensure fresh state
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const redirectURL = `${window.location.origin}/auth`;
      console.log("Starting Google sign in with redirect URL:", redirectURL);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectURL,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-chatgpt-main">
      <div className="bg-chatgpt-sidebar p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-8 text-white">Welcome to Persona Creator</h1>
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white text-black hover:bg-gray-100 transition-colors duration-200"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Globe className="mr-2 h-4 w-4" />
          {isLoading ? "Connecting..." : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
};

export default Auth;