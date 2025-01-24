import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonaList } from "./persona/PersonaList";
import TrainingUploader from "./TrainingUploader";
import VideoCallUI from "./VideoCallUI";
import { Upload, User, LogOut } from "lucide-react";

const PersonaCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [personas, setPersonas] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        navigate("/auth");
      } else {
        // Fetch personas when authenticated
        fetchPersonas();
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchPersonas = async () => {
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching personas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPersonas(personas || []);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePicture(file);
  };

  const handleCreatePersona = async () => {
    try {
      setIsCreating(true);

      let profilePictureUrl = null;
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('persona_profiles')
          .upload(filePath, profilePicture);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('persona_profiles')
          .getPublicUrl(filePath);

        profilePictureUrl = publicUrl;
      }

      const { data: persona, error: createError } = await supabase
        .from('personas')
        .insert({
          name,
          description,
          profile_picture_url: profilePictureUrl,
          status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Success",
        description: "Persona created successfully",
      });

      setName("");
      setDescription("");
      setProfilePicture(null);
      setSelectedPersona(persona);
      fetchPersonas(); // Refresh the personas list

    } catch (error: any) {
      console.error('Error creating persona:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Your Persona</h1>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="create" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Persona</TabsTrigger>
          <TabsTrigger value="manage">Manage Personas</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-8">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter persona name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your persona"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-picture">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  {profilePicture && (
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('profile-picture')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Picture
                  </Button>
                  <input
                    id="profile-picture"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreatePersona}
                disabled={isCreating || !name}
                className="w-full"
              >
                {isCreating ? (
                  "Creating..."
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Create Persona
                  </>
                )}
              </Button>
            </div>
          </Card>

          {selectedPersona && (
            <>
              <TrainingUploader
                personaId={selectedPersona.id}
                onUploadComplete={() => {
                  toast({
                    title: "Training Material Added",
                    description: "The material has been uploaded and will be processed",
                  });
                }}
              />
              <VideoCallUI persona={selectedPersona} />
            </>
          )}
        </TabsContent>

        <TabsContent value="manage">
          <PersonaList
            personas={personas}
            onSelect={setSelectedPersona}
            onDelete={async (id) => {
              try {
                const { error } = await supabase
                  .from('personas')
                  .delete()
                  .eq('id', id);

                if (error) throw error;

                toast({
                  title: "Success",
                  description: "Persona deleted successfully",
                });
                fetchPersonas(); // Refresh the list after deletion
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: error.message,
                  variant: "destructive",
                });
              }
            }}
            onDeploy={async () => {}}
            onEdit={() => {}}
            isDeploying={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonaCreator;