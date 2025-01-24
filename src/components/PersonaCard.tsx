import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, PlayCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface PersonaCardProps {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
}

export const PersonaCard = ({ id, name, description, status }: PersonaCardProps) => {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      console.log('Deploying persona:', id);
      
      const { data, error } = await supabase.functions.invoke('deploy-persona', {
        body: { personaId: id }
      });

      if (error) {
        console.error('Deploy function error:', error);
        throw error;
      }

      if (!data.success) {
        console.error('Deploy failed:', data.error);
        throw new Error(data.error || 'Deployment failed');
      }

      toast({
        title: "Success",
        description: "Persona deployed successfully",
      });
    } catch (error: any) {
      console.error('Deploy error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy persona",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
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
          <Button 
            onClick={handleDeploy} 
            variant="outline" 
            size="sm"
            disabled={isDeploying}
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              'Deploy Persona'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};