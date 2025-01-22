import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PersonaForm } from "./persona/PersonaForm";
import { PersonaPreview } from "./persona/PersonaPreview";
import { PersonaList } from "./persona/PersonaList";
import { PersonaActions } from "./persona/PersonaActions";
import VideoCallInterface from "./VideoCallInterface";

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
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [avatarAnimating, setAvatarAnimating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceStyle, setVoiceStyle] = useState<string>("alloy");
  const [isCreating, setIsCreating] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

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
          user_id: session.user.id
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
          personaId: persona.id
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

  const toggleWebcam = async () => {
    try {
      if (!isWebcamActive) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setIsWebcamActive(true);
        setIsAnalyzing(true);
        setAvatarAnimating(true);
      } else {
        setIsWebcamActive(false);
        setIsAnalyzing(false);
        setAvatarAnimating(false);
      }
    } catch (error: any) {
      console.error("Webcam error:", error);
      toast({
        title: "Webcam Error",
        description: error.message || "Failed to access webcam",
        variant: "destructive",
      });
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
              onSubmit={handleCreatePersona}
              isCreating={isCreating}
            />
          </div>
          <div className="space-y-6">
            <PersonaPreview
              isWebcamActive={isWebcamActive}
              toggleWebcam={toggleWebcam}
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