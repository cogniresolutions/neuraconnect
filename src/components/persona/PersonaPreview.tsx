import Avatar3D from "../Avatar3D";

interface PersonaPreviewProps {
  avatarAnimating: boolean;
}

export const PersonaPreview = ({
  avatarAnimating,
}: PersonaPreviewProps) => {
  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar3D isAnimating={avatarAnimating} />
        </div>
      </div>
    </div>
  );
};