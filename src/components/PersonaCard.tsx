import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonaCardProps {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
}

export const PersonaCard = ({ id, name, description, status }: PersonaCardProps) => {
  const { toast } = useToast();

  const handleDeploy = async () => {
    try {
      const { error } = await supabase.functions.invoke('deploy-persona', {
        body: { personaId: id }
      });

      if (error) throw error;

      toast({
        title: "Deployment Started",
        description: `${name} is being deployed`,
      });
    } catch (error: any) {
      console.error('Deploy error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'deployed' ? (
            <PlayCircle className="h-5 w-5 text-blue-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
      <CardFooter>
        {status !== 'deployed' && (
          <Button onClick={handleDeploy} variant="outline" size="sm">
            Deploy Persona
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};