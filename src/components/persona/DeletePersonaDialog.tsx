import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeletePersonaDialogProps {
  personaId: string;
  personaName: string;
  onDelete: () => void;
}

export const DeletePersonaDialog = ({ personaId, personaName, onDelete }: DeletePersonaDialogProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const startTime = performance.now();
    setIsDeleting(true);
    
    try {
      console.log('Starting deletion process for persona:', personaId);
      
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId);

      if (error) throw error;

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Log successful deletion
      await supabase.from('api_monitoring').insert({
        endpoint: 'delete-persona',
        status: 'success',
        response_time: responseTime
      });

      toast({
        title: "Success",
        description: `${personaName} has been deleted successfully`,
      });

      onDelete();
    } catch (error: any) {
      console.error('Error deleting persona:', error);
      
      // Log error
      await supabase.from('api_monitoring').insert({
        endpoint: 'delete-persona',
        status: 'error',
        error_message: error.message
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete persona. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-100"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {personaName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the persona
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};