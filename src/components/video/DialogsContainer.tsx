import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConsentDialog } from './ConsentDialog';

interface DialogsContainerProps {
  showNameDialog: boolean;
  setShowNameDialog: (show: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  showConsentDialog: boolean;
  setShowConsentDialog: (show: boolean) => void;
  onStartCall: () => void;
  personaName: string;
}

export const DialogsContainer: React.FC<DialogsContainerProps> = ({
  showNameDialog,
  setShowNameDialog,
  userName,
  setUserName,
  showConsentDialog,
  setShowConsentDialog,
  onStartCall,
  personaName,
}) => {
  return (
    <>
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
            <DialogDescription>
              Please enter your name to start the video call
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <Button 
              onClick={() => {
                if (userName.trim()) {
                  setShowNameDialog(false);
                  onStartCall();
                }
              }}
              disabled={!userName.trim()}
            >
              Start Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onAccept={() => {
          setShowConsentDialog(false);
          onStartCall();
        }}
        personaName={personaName}
      />
    </>
  );
};