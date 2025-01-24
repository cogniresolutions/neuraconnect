import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from 'lucide-react';

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  personaName: string;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({
  open,
  onOpenChange,
  onAccept,
  personaName,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Start Call with {personaName}
          </DialogTitle>
          <DialogDescription className="text-base">
            By starting this call, you agree to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Allow camera and microphone access</li>
              <li>Permit emotion analysis for better interaction</li>
              <li>Accept our terms of service and privacy policy</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex sm:justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onAccept();
              onOpenChange(false);
            }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            Accept & Start Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};