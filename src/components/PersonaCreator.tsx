import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, LogOut, Save, AlertTriangle, CheckCircle, ServerIcon, PlayCircle, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Avatar3D from "./Avatar3D";
import { VALID_VOICES } from "@/constants/voices";
import { validatePersonaDescription, getSuggestedDescription } from "@/utils/personaValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Persona {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

const PersonaCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [avatarAnimating, setAvatarAnimating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceStyle, setVoiceStyle] = useState<string>("alloy");
  const [isCreating, setIsCreating] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  const [validationResult, setValidationResult] = useState({
    isValid: true,
    issues: [] as string[],
    suggestions: [] as string[],
  });

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

      setPersonas(personasData || []);
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    const result = validatePersonaDescription(newDescription);
    setValidationResult(result);
  };

  const handleSuggestImprovement = () => {
    const improvedDescription = getSuggestedDescription(description);
    setDescription(improvedDescription);
    const result = validatePersonaDescription(improvedDescription);
    setValidationResult(result);
    toast({
      title: "Description Updated",
      description: "The description has been improved with suggested changes.",
    });
  };

  const handleCreatePersona = async () => {
    const validationResult = validatePersonaDescription(description);
    if (!validationResult.isValid) {
      toast({
        title: "Validation Error",
        description: "Please address the validation issues before creating the persona.",
        variant: "destructive",
      });
      return;
    }

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

  const handleEdit = async (persona: Persona) => {
    setName(persona.name);
    setDescription(persona.description || '');
    setVoiceStyle(persona.voice_style || 'alloy');
    const result = validatePersonaDescription(persona.description || '');
    setValidationResult(result);
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsWebcamActive(true);
          setIsAnalyzing(true);
          setAvatarAnimating(true);
        }
      } else {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
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

  const createdPersonas = personas.filter(p => p.status === 'ready');
  const deployedPersonas = personas.filter(p => p.status === 'deployed');

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
            <Button
              variant="outline"
              className="bg-white/10 text-white border-purple-400/30 hover:bg-white/20 transition-all duration-300"
              onClick={toggleWebcam}
            >
              {isWebcamActive ? (
                <>
                  <CameraOff className="mr-2 h-4 w-4" />
                  Disable Camera
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Enable Camera
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-red-500/20 text-white border-red-400/30 hover:bg-red-500/30 transition-all duration-300"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Creation Form */}
          <div className="space-y-6">
            <Card className="border-0 bg-white/5 backdrop-blur-lg shadow-xl">
              <CardContent className="p-6 space-y-6">
                <Input
                  placeholder="Persona Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400"
                />
                <div className="space-y-3">
                  <Textarea
                    placeholder="Persona Description"
                    value={description}
                    onChange={handleDescriptionChange}
                    className="bg-white/10 border-purple-400/30 text-white min-h-[120px] placeholder:text-gray-400"
                  />
                  {!validationResult.isValid && (
                    <Alert variant="destructive" className="bg-red-500/20 border-red-400/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Validation Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {validationResult.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  {validationResult.suggestions.length > 0 && (
                    <Alert className="bg-purple-500/20 border-purple-400/30">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Suggestions</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {validationResult.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSuggestImprovement}
                          className="mt-2 bg-purple-500/20 border-purple-400/30 hover:bg-purple-500/30"
                        >
                          Apply Suggestions
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                  <SelectTrigger className="bg-white/10 border-purple-400/30 text-white">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_VOICES.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300"
                  onClick={handleCreatePersona}
                  disabled={isCreating || !validationResult.isValid}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isCreating ? "Creating..." : "Create Persona"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card className="border-0 bg-white/5 backdrop-blur-lg shadow-xl overflow-hidden">
              <CardContent className="p-6">
                {isWebcamActive && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/50 mb-6">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/50">
                  <Avatar3D isAnimating={avatarAnimating} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Personas List */}
        <div className="mt-12 space-y-8">
          {/* Created Personas */}
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-400 mb-6">
              Created Personas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdPersonas.map((persona) => (
                <Card key={persona.id} className="border-0 bg-white/5 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">{persona.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-sm text-gray-400">Created</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 line-clamp-3">{persona.description}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(persona)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-red-500/20 border-red-400/30 hover:bg-red-500/30 text-white"
                        onClick={() => handleDelete(persona.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeploy(persona.id)}
                        disabled={isDeploying}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isDeploying ? (
                          <>
                            <ServerIcon className="mr-2 h-4 w-4 animate-pulse" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <ServerIcon className="mr-2 h-4 w-4" />
                            Deploy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Deployed Personas */}
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-400 mb-6">
              Deployed Personas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deployedPersonas.map((persona) => (
                <Card key={persona.id} className="border-0 bg-white/5 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">{persona.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="h-5 w-5 text-blue-400" />
                        <span className="text-sm text-gray-400">Deployed</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 line-clamp-3">{persona.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaCreator;
