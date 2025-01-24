import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PersonaForm } from "./persona/PersonaForm";
import { PersonaPreview } from "./persona/PersonaPreview";
import { PersonaList } from "./persona/PersonaList";
import { PersonaActions } from "./persona/PersonaActions";
import VideoCallInterface from "./VideoCallInterface";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2, Loader2, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AzureTest from './AzureTest';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Persona {
  id: string;
  user_id?: string;
  name: string;
  description: string | null;
  voice_style?: string | null;
  personality?: string | null;
  avatar_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  skills?: any;
  topics?: string[];
  model_config?: any;
  avatar_model_url?: string | null;
  emotion_settings?: {
    sensitivity: number;
    response_delay: number;
  };
  environment_analysis?: boolean;
  facial_expressions?: any[];
}

const PersonaCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [avatarAnimating, setAvatarAnimating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceStyle, setVoiceStyle] = useState<string>("alloy");
  const [language, setLanguage] = useState<string>("en");
  const [isCreating, setIsCreating] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isTestingAzure, setIsTestingAzure] = useState(false);
  const [azureTestSuccess, setAzureTestSuccess] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchPersonas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const { data: personasData, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching personas",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const typedPersonas = (personasData || []).map(persona => ({
        ...persona,
        emotion_settings: persona.emotion_settings as { sensitivity: number; response_delay: number }
      })) as Persona[];

      setPersonas(typedPersonas);
    };
    
    checkAuthAndFetchPersonas();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personas'
        },
        () => {
          checkAuthAndFetchPersonas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, toast]);

  const handleCreatePersona = async () => {
    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to create a persona");
      }

      const { data: persona, error: createError } = await supabase
        .from('personas')
        .insert({
          name,
          description,
          voice_style: voiceStyle,
          status: 'ready',
          user_id: session.user.id,
          model_config: {
            model: "gpt-4o-mini",
            max_tokens: 800,
            temperature: 0.7,
            language
          }
        })
        .select()
        .single();

      if (createError) throw createError;

      const { error: functionError } = await supabase.functions.invoke('create-persona', {
        body: { 
          name,
          description,
          voiceStyle,
          personality: "friendly and helpful",
          personaId: persona.id,
          language
        }
      });

      if (functionError) throw functionError;

      toast({
        title: "Success",
        description: "Persona created successfully",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error creating persona:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create persona",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeploy = async (personaId: string) => {
    setIsDeploying(true);
    try {
      const { error } = await supabase.functions.invoke("deploy-persona", {
        body: { personaId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deployment initiated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deploy persona",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (personaId: string) => {
    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Persona deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete persona",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (persona: Persona) => {
    setName(persona.name);
    setDescription(persona.description || '');
    setVoiceStyle(persona.voice_style || 'alloy');
    toast({
      title: "Persona loaded for editing",
      description: "You can now make changes to the persona.",
    });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const testAzureServices = async () => {
    try {
      setIsTestingAzure(true);
      const { data, error } = await supabase.functions.invoke('analyze-environment', {
        body: { test: true }
      });

      if (error) throw error;

      console.log("Azure test response:", data);
      setAzureTestSuccess(true);
      toast({
        title: "Azure Services Test",
        description: "Successfully connected to Azure AI Services!",
      });
    } catch (error: any) {
      console.error("Azure test error:", error);
      setAzureTestSuccess(false);
      toast({
        title: "Azure Services Test Failed",
        description: error.message || "Failed to connect to Azure services",
        variant: "destructive",
      });
    } finally {
      setIsTestingAzure(false);
    }
  };

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
  };

  const handleCallStateChange = (isActive: boolean) => {
    setIsCallActive(isActive);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-400">
              Create Your Persona
            </h1>
            <p className="text-gray-400 mt-2">Design and customize your AI companion</p>
          </div>
          <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-purple-400/30">
                  <Settings className="h-4 w-4 mr-2" />
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Developer Tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {}}
                  className="flex items-center"
                >
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <Brain className="mr-2 h-4 w-4" />
                        Test Azure AI Services
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-black/95">
                      <SheetHeader>
                        <SheetTitle className="text-white">Azure Services Test</SheetTitle>
                        <SheetDescription className="text-gray-400">
                          Test the connection to Azure AI services and verify their functionality.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <AzureTest />
                      </div>
                    </SheetContent>
                  </Sheet>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <PersonaActions onSignOut={handleSignOut} />
          </div>
        </div>

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

        {selectedPersona && (
          <VideoCallInterface
            persona={selectedPersona}
            onCallStateChange={handleCallStateChange}
          />
        )}
      </div>
    </div>
  );
};

export default PersonaCreator;
