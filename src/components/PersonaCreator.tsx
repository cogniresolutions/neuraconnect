import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, LogOut, Save, AlertTriangle, CheckCircle } from "lucide-react";
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

  const [validationResult, setValidationResult] = useState({
    isValid: true,
    issues: [] as string[],
    suggestions: [] as string[],
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    
    checkAuth();
  }, [navigate]);

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
      // Get the current user's ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to create a persona");
      }

      // First, create the persona record with the user_id
      const { data: persona, error: createError } = await supabase
        .from('personas')
        .insert({
          name,
          description,
          voice_style: voiceStyle,
          status: 'ready',
          user_id: session.user.id  // Set the user_id here
        })
        .select()
        .single();

      if (createError) throw createError;

      // Then, initiate the persona creation process
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

      // Navigate to the home page after successful creation
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

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Create Your Persona</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-600"
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
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Input
              placeholder="Persona Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <div className="space-y-2">
              <Textarea
                placeholder="Persona Description"
                value={description}
                onChange={handleDescriptionChange}
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
              />
              {!validationResult.isValid && (
                <Alert variant="destructive">
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
                <Alert>
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
                      className="mt-2"
                    >
                      Apply Suggestions
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <Select value={voiceStyle} onValueChange={setVoiceStyle}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
              className="w-full"
              onClick={handleCreatePersona}
              disabled={isCreating || !validationResult.isValid}
            >
              <Save className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create Persona"}
            </Button>
          </div>

          <div className="space-y-4">
            {isWebcamActive && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
              <Avatar3D isAnimating={avatarAnimating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaCreator;
