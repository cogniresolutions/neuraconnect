import { Button } from "@/components/ui/button";
import { PersonaForm } from "./PersonaForm";
import { PersonaPreview } from "./PersonaPreview";
import { PersonaList } from "./PersonaList";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  signInWithGoogle,
}: PersonaCreatorTabsProps) => {
  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="create">Create Persona</TabsTrigger>
        <TabsTrigger value="signin">Sign In</TabsTrigger>
      </TabsList>
      
      <TabsContent value="create" className="space-y-8">
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
      </TabsContent>
      
      <TabsContent value="signin" className="space-y-8">
        <div className="max-w-md mx-auto bg-white/5 p-8 rounded-lg border border-purple-400/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-gray-400 mt-2">Sign in to access your personas</p>
          </div>
          <Button
            onClick={signInWithGoogle}
            className="w-full bg-white hover:bg-gray-100 text-gray-900"
            variant="outline"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};