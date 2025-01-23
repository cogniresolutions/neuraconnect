import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) {
          navigate('/');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to check authentication status. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN') {
        if (session?.provider_token) {
          // Handle Google sign-in specific logic if needed
          console.log('Signed in with Google', session.user?.user_metadata);
          toast({
            title: "Welcome!",
            description: `Signed in with Google as ${session.user?.email}`,
          });
        } else {
          toast({
            title: "Welcome!",
            description: "You have successfully signed in.",
          });
        }
        navigate('/');
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Goodbye!",
          description: "You have been signed out.",
        });
      } else if (event === 'USER_UPDATED') {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Password Recovery",
          description: "Check your email for password reset instructions.",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-purple-200">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-400">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-400">
            Sign in to your account or create a new one
          </p>
        </div>
        
        <div className="bg-white/5 p-8 rounded-lg border border-purple-400/20 backdrop-blur-sm">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#9333ea',
                    brandAccent: '#a855f7',
                    inputBackground: 'rgba(255, 255, 255, 0.05)',
                    inputBorder: 'rgba(147, 51, 234, 0.2)',
                    inputText: 'white',
                    inputPlaceholder: 'rgba(255, 255, 255, 0.5)',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                },
              },
              style: {
                button: {
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                },
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                  color: 'white',
                  transition: 'all 0.2s ease',
                },
                anchor: {
                  color: '#a855f7',
                  fontWeight: '500',
                  transition: 'color 0.2s ease',
                },
                message: {
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                container: {
                  gap: '1rem',
                },
              },
            }}
            providers={['google']}
            theme="dark"
          />
        </div>

        <div className="text-center text-sm text-gray-400">
          <p>
            By signing in, you agree to our{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;