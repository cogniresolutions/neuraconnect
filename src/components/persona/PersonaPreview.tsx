import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";

interface PersonaPreviewProps {
  isWebcamActive: boolean;
  toggleWebcam: () => void;
  avatarAnimating: boolean;
  profilePictureUrl?: string | null;
}

export function PersonaPreview({ 
  isWebcamActive, 
  toggleWebcam, 
  avatarAnimating,
  profilePictureUrl 
}: PersonaPreviewProps) {
  return (
    <Card className="p-6 bg-white/5 border-purple-400/20">
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 relative">
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt="Persona Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {avatarAnimating ? (
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button
          onClick={toggleWebcam}
          variant="outline"
          className="w-full bg-purple-900/30 hover:bg-purple-900/40"
        >
          {isWebcamActive ? "Stop Preview" : "Start Preview"}
        </Button>
      </div>
    </Card>
  );
}