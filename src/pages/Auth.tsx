import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (session) {
        navigate("/");
      }
    });

    // Check for authentication errors in URL
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="border-0 bg-white/5 backdrop-blur-lg shadow-xl">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-purple-600/90 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-purple-400">
                Welcome to NeuraConnect
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Create and interact with your personalized AI companions
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white/10 text-white border-purple-400/30 hover:bg-white/20 hover:text-white group relative overflow-hidden transition-all duration-300 h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Globe className="mr-3 h-6 w-6 text-purple-300" />
                  Continue with Google
                  <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                </>
              )}
            </Button>

            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-purple-300/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900/80 px-4 text-purple-300 font-medium tracking-wider">
                    Secure Authentication
                  </span>
                </div>
              </div>
              
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-400 px-8 leading-relaxed">
                  By continuing, you agree to our Terms of Service and Privacy Policy. 
                  Your data is protected with enterprise-grade security.
                </p>
                <p className="text-xs text-purple-300/70">
                  Powered by NeuraConnect AI Technology
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;