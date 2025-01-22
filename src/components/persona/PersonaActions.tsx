import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface PersonaActionsProps {
  onSignOut: () => void;
}

export const PersonaActions = ({ onSignOut }: PersonaActionsProps) => {
  return (
    <Button
      variant="outline"
      className="bg-red-500/20 text-white border-red-400/30 hover:bg-red-500/30 transition-all duration-300"
      onClick={onSignOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
};