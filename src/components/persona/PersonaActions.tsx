import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PersonaActionsProps {
  onSignOut: () => void;
}

export const PersonaActions = ({ onSignOut }: PersonaActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Call the provided onSignOut callback
      onSignOut();
      
      // Show success toast
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });

      // Redirect to auth page
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      className="bg-red-500/20 text-white border-red-400/30 hover:bg-red-500/30 transition-all duration-300"
      onClick={handleSignOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
};