import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
    try {
      setLoading(true);
      
      let result;
      if (type === 'LOGIN') {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      }

      const { error } = result;
      
      if (error) throw error;

      if (type === 'SIGNUP') {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link.",
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-chatgpt-main py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-6 space-y-8 bg-chatgpt-secondary border-chatgpt-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Welcome</h2>
          <p className="mt-2 text-sm text-gray-300">
            Sign in to your account or create a new one
          </p>
        </div>

        <Button
          className="w-full bg-white text-black hover:bg-gray-200"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Continue with Google'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-chatgpt-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-chatgpt-secondary px-2 text-gray-300">
              Or continue with
            </span>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-chatgpt-hover">
            <TabsTrigger value="login" className="text-white data-[state=active]:bg-chatgpt-main">Login</TabsTrigger>
            <TabsTrigger value="signup" className="text-white data-[state=active]:bg-chatgpt-main">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-chatgpt-main border-chatgpt-border text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-chatgpt-main border-chatgpt-border text-white"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => handleAuth('LOGIN')}
              disabled={loading || !email || !password}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-white">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-chatgpt-main border-chatgpt-border text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-white">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-chatgpt-main border-chatgpt-border text-white"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => handleAuth('SIGNUP')}
              disabled={loading || !email || !password}
            >
              {loading ? 'Loading...' : 'Create Account'}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;