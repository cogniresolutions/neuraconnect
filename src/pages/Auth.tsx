import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session check:', session);
      
      if (session) {
        console.log('User is already authenticated, redirecting...');
        handleAuthSuccess(session);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
        handleAuthSuccess(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setError(null);
      }
    });

    // Check for redirect error
    const hash = window.location.hash;
    if (hash && hash.includes('error')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDescription = params.get('error_description');
      if (errorDescription) {
        console.error('Auth redirect error:', errorDescription);
        setError(errorDescription);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: errorDescription,
        });
      }
    }

    return () => {
      console.log('Cleaning up auth subscriptions');
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleAuthSuccess = async (session: any) => {
    console.log('Handling successful authentication');
    try {
      setIsLoading(true);
      setError(null);

      // Ensure we have a user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      console.log('User profile:', profile);
      
      toast({
        title: "Welcome!",
        description: "You've successfully signed in.",
      });

      // Navigate to video call page
      console.log('Navigating to video call page');
      navigate('/video-call');
    } catch (err) {
      console.error('Error in auth success handler:', err);
      setError('Failed to complete authentication. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete sign in process. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Video Chat
          </CardTitle>
          <CardDescription className="text-center">
            Please sign in to start a video call
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <SupabaseAuth 
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#4F46E5',
                      brandAccent: '#4338CA',
                      defaultButtonBackground: '#4F46E5',
                      defaultButtonBackgroundHover: '#4338CA',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.5rem',
                      inputBorderRadius: '0.5rem',
                    },
                  },
                },
                className: {
                  container: 'w-full',
                  button: 'w-full px-4 py-2 rounded-lg',
                  input: 'w-full px-4 py-2 rounded-lg border border-gray-300',
                },
              }}
              providers={['google']}
              redirectTo={window.location.origin}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;