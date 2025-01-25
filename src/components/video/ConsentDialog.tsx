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
import { Shield, Camera, Mic } from 'lucide-react';

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
          <DialogDescription className="space-y-4">
            <p>Before starting the call, please ensure:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-purple-500" />
                <span>Your camera is working and properly positioned</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-purple-500" />
                <span>Your microphone is connected and working</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to allow camera and microphone access for this call.
            </p>
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
            Start Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};