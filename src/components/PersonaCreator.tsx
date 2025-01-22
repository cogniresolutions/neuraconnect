import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VALID_VOICES } from "@/constants/voices";
import { VALID_SKILLS, VALID_TOPICS, ValidSkill, ValidTopic } from "@/constants/personaOptions";

type ValidVoice = typeof VALID_VOICES[number];

interface PersonaFormData {
  name: string;
  description: string;
  voiceStyle: ValidVoice;
  personality: string;
  skills: ValidSkill[];
  topics: ValidTopic[];
}

const PersonaCreator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [topicsInput, setTopicsInput] = useState("");
  const [formData, setFormData] = useState<PersonaFormData>({
    name: "",
    description: "",
    voiceStyle: "alloy",
    personality: "",
    skills: [],
    topics: [],
  });
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVoiceChange = (value: ValidVoice) => {
    setFormData(prev => ({ ...prev, voiceStyle: value }));
  };

  const handleSkillsInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSkillsInput(e.target.value);
    const inputSkills = e.target.value.split('\n').map(skill => skill.trim());
    const validSkills = inputSkills.filter((skill): skill is ValidSkill => 
      VALID_SKILLS.includes(skill as ValidSkill)
    );
    
    if (validSkills.length !== inputSkills.length) {
      toast({
        title: "Invalid Skills Detected",
        description: "Some skills were removed as they are not supported by OpenAI.",
        variant: "destructive",
      });
    }

    setFormData(prev => ({
      ...prev,
      skills: Array.from(new Set(validSkills)) // Remove duplicates
    }));
  };

  const handleTopicsInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTopicsInput(e.target.value);
    const inputTopics = e.target.value.split('\n').map(topic => topic.trim());
    const validTopics = inputTopics.filter((topic): topic is ValidTopic => 
      VALID_TOPICS.includes(topic as ValidTopic)
    );
    
    if (validTopics.length !== inputTopics.length) {
      toast({
        title: "Invalid Topics Detected",
        description: "Some topics were removed as they are not supported by OpenAI.",
        variant: "destructive",
      });
    }

    setFormData(prev => ({
      ...prev,
      topics: Array.from(new Set(validTopics)) // Remove duplicates
    }));
  };

  const formatError = (error: any): string => {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    return "An unexpected error occurred";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast({
          title: "Authentication Error",
          description: formatError(sessionError),
          variant: "destructive",
        });
        return;
      }
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a persona",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Creating Persona",
        description: "Please wait while we create your persona...",
      });

      const { data: personaData, error: personaError } = await supabase
        .from('personas')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            voice_style: formData.voiceStyle,
            personality: formData.personality,
            skills: formData.skills,
            topics: formData.topics,
            status: 'draft',
            user_id: session.user.id
          }
        ])
        .select()
        .single();

      if (personaError) {
        toast({
          title: "Creation Failed",
          description: formatError(personaError),
          variant: "destructive",
        });
        return;
      }

      setCurrentPersonaId(personaData.id);

      const { data, error } = await supabase.functions.invoke("create-persona", {
        body: { ...formData, personaId: personaData.id }
      });

      if (error) {
        toast({
          title: "Creation Error",
          description: formatError(error),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your persona has been created successfully",
        variant: "default",
      });

      // Reset form with valid default voice
      setFormData({
        name: "",
        description: "",
        voiceStyle: "alloy",
        personality: "",
        skills: [],
        topics: [],
      });
    } catch (error) {
      console.error("Error creating persona:", error);
      toast({
        title: "Error",
        description: formatError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!currentPersonaId) {
      toast({
        title: "Deployment Error",
        description: "Please create a persona first before deploying",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast({
          title: "Authentication Error",
          description: formatError(sessionError),
          variant: "destructive",
        });
        return;
      }
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to deploy a persona",
          variant: "destructive",
        });
        return;
      }

      // Show deploying notification
      toast({
        title: "Deploying Persona",
        description: "Please wait while we deploy your persona...",
      });

      const { data, error } = await supabase.functions.invoke("deploy-persona", {
        body: { personaId: currentPersonaId }
      });

      if (error) {
        toast({
          title: "Deployment Failed",
          description: formatError(error),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your persona has been deployed successfully",
      });
    } catch (error) {
      console.error("Error deploying persona:", error);
      toast({
        title: "Deployment Error",
        description: formatError(error),
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-chatgpt-secondary rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create New Persona</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Persona Name</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter persona name"
            className="w-full bg-chatgpt-main"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your persona's purpose and characteristics"
            className="w-full bg-chatgpt-main min-h-[100px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Voice Style</label>
          <Select
            value={formData.voiceStyle}
            onValueChange={(value: ValidVoice) => handleVoiceChange(value)}
          >
            <SelectTrigger className="w-full bg-chatgpt-main">
              <SelectValue placeholder="Select a voice style" />
            </SelectTrigger>
            <SelectContent>
              {VALID_VOICES.map((voice) => (
                <SelectItem key={voice} value={voice}>
                  {voice.charAt(0).toUpperCase() + voice.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Personality Traits</label>
          <Textarea
            name="personality"
            value={formData.personality}
            onChange={handleInputChange}
            placeholder="Describe the personality traits of your persona"
            className="w-full bg-chatgpt-main min-h-[100px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Skills (One per line)</label>
          <div className="text-sm text-gray-500 mb-2">
            Valid skills: {VALID_SKILLS.join(", ")}
          </div>
          <Textarea
            value={skillsInput}
            onChange={handleSkillsInputChange}
            placeholder="Enter skills (one per line)"
            className="w-full bg-chatgpt-main min-h-[100px]"
          />
          <div className="mt-2">
            <h4 className="text-sm font-medium">Selected Skills:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 bg-blue-500 text-white rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Topics (One per line)</label>
          <div className="text-sm text-gray-500 mb-2">
            Valid topics: {VALID_TOPICS.join(", ")}
          </div>
          <Textarea
            value={topicsInput}
            onChange={handleTopicsInputChange}
            placeholder="Enter topics (one per line)"
            className="w-full bg-chatgpt-main min-h-[100px]"
          />
          <div className="mt-2">
            <h4 className="text-sm font-medium">Selected Topics:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-1 bg-green-500 text-white rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Persona...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create Persona
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleDeploy}
            className="flex-1"
            disabled={isDeploying || !currentPersonaId}
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Deploy Persona
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonaCreator;
