import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoCallInterface from "./VideoCallInterface";
import { PersonaHeader } from "./persona/PersonaHeader";
import { PersonaCreatorTabs } from "./persona/PersonaCreatorTabs";

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

  useEffect(() => {
    const checkAuthAndFetchPersonas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
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

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    }
  };

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

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
  };

  const handleCallStateChange = (isActive: boolean) => {
    setIsCallActive(isActive);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        <PersonaHeader onSignOut={handleSignOut} />
        
        <PersonaCreatorTabs
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          voiceStyle={voiceStyle}
          setVoiceStyle={setVoiceStyle}
          language={language}
          setLanguage={setLanguage}
          isCreating={isCreating}
          avatarAnimating={avatarAnimating}
          personas={personas}
          isDeploying={isDeploying}
          handleCreatePersona={handleCreatePersona}
          handleDeploy={handleDeploy}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
          handlePersonaSelect={handlePersonaSelect}
          signInWithGoogle={signInWithGoogle}
        />

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