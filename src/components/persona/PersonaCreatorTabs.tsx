import { PersonaForm } from "./PersonaForm";
import { PersonaPreview } from "./PersonaPreview";
import { PersonaList } from "./PersonaList";

interface PersonaCreatorTabsProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  voiceStyle: string;
  setVoiceStyle: (style: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  isCreating: boolean;
  avatarAnimating: boolean;
  personas: any[];
  isDeploying: boolean;
  handleCreatePersona: () => Promise<void>;
  handleDeploy: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleEdit: (persona: any) => void;
  handlePersonaSelect: (persona: any) => void;
  signInWithGoogle: () => Promise<void>;
}

export const PersonaCreatorTabs = ({
  name,
  setName,
  description,
  setDescription,
  voiceStyle,
  setVoiceStyle,
  language,
  setLanguage,
  isCreating,
  avatarAnimating,
  personas,
  isDeploying,
  handleCreatePersona,
  handleDeploy,
  handleDelete,
  handleEdit,
  handlePersonaSelect,
}: PersonaCreatorTabsProps) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <PersonaForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            voiceStyle={voiceStyle}
            setVoiceStyle={setVoiceStyle}
            language={language}
            setLanguage={setLanguage}
            onSubmit={handleCreatePersona}
            isCreating={isCreating}
          />
        </div>
        <div className="space-y-6">
          <PersonaPreview
            avatarAnimating={avatarAnimating}
          />
        </div>
      </div>

      <div className="mt-12">
        <PersonaList
          personas={personas}
          onDeploy={handleDeploy}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onSelect={handlePersonaSelect}
          isDeploying={isDeploying}
        />
      </div>
    </div>
  );
};