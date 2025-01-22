import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (session) {
        navigate("/create-persona");
      }
    });

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="border-0 bg-gray-800/50 backdrop-blur-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-purple-600 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Sign in to access your AI personas and continue your journey
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white/10 text-white border-gray-600 hover:bg-white/20 hover:text-white group relative overflow-hidden transition-all duration-300"
              onClick={handleGoogleSignIn}
            >
              <Globe className="mr-2 h-5 w-5" />
              Continue with Google
              <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
            </Button>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">
                    Secure Authentication
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 text-center px-6">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;