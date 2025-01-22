import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, LogOut, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Avatar3D from "./Avatar3D";
import { VALID_VOICES } from "@/constants/voices";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  useEffect(() => {
    let analysisInterval: NodeJS.Timeout;

    if (isAnalyzing && videoRef.current) {
      analysisInterval = setInterval(async () => {
        await analyzeEnvironment();
      }, 5000);
    }

    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
    };
  }, [isAnalyzing]);

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

  const analyzeEnvironment = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: { imageData }
      });

      if (error) throw error;
      
      console.log('Environment Analysis:', data);
      
      toast({
        title: "Environment Analyzed",
        description: "Scene analysis completed successfully",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze environment",
        variant: "destructive",
      });
    }
  };

  const handleCreatePersona = async () => {
    if (!name || !description || !voiceStyle) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // First, create the persona record
      const { data: persona, error: createError } = await supabase
        .from('personas')
        .insert({
          name,
          description,
          voice_style: voiceStyle,
          status: 'ready'
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

      // Navigate to the chat interface
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
            <Textarea
              placeholder="Persona Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
            />
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
              disabled={isCreating}
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