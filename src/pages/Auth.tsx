import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#1A1F2C] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Building2 className="h-12 w-12 text-[#9b87f5] mb-4" />
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-gray-400">Sign in with Google to continue</p>
        </div>
        
        <div className="bg-[#221F26] p-8 rounded-lg shadow-xl border border-gray-800">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#9b87f5',
                    brandAccent: '#7E69AB',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
              },
            }}
            providers={["google"]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>

      <style>{`
        .auth-container {
          width: 100%;
        }
        .auth-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.375rem;
          background-color: #9b87f5;
          color: white;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .auth-button:hover {
          background-color: #7E69AB;
        }
      `}</style>
    </div>
  );
};

export default Auth;