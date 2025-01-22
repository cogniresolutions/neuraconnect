import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Plus, UserCircle2, Video, Users, MessageSquare, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PersonaList } from "@/components/persona/PersonaList";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: personas, isLoading } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

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

  const handleDeploy = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('deploy-persona', {
        body: { personaId: id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Persona deployment started",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deploy persona",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete persona",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (persona: any) => {
    navigate(`/create-persona?id=${persona.id}`);
  };

  const features = [
    {
      title: "Create Video",
      description: "Generate a video with a replica",
      icon: <Video className="h-6 w-6 text-pink-400" />,
      onClick: () => navigate("/video-chat"),
    },
    {
      title: "Create Replica",
      description: "Clone yourself in minutes",
      icon: <Users className="h-6 w-6 text-orange-400" />,
      onClick: () => navigate("/create-persona"),
    },
    {
      title: "Create Conversation",
      description: "Talk with a replica in real-time",
      icon: <MessageSquare className="h-6 w-6 text-purple-400" />,
      onClick: () => navigate("/video-chat"),
    },
    {
      title: "Create API Key",
      description: "Start building with an API Key",
      icon: <Key className="h-6 w-6 text-blue-400" />,
      onClick: () => navigate("/api-keys"),
    },
  ];

  const stockPersonas = [
    {
      name: "Demo Persona",
      description: "Meet Carter, a Tavus team member",
      image: "/demo-persona.jpg",
    },
    {
      name: "Santa",
      description: "Chat with AI Santa Anytime, Anywhere",
      image: "/santa-persona.jpg",
    },
    {
      name: "Tavus' Personal AI",
      description: "A digital personal assistant for Tavus users",
      image: "/tavus-ai.jpg",
    },
    {
      name: "Technical Co Pilot",
      description: "Build technical co-pilots to supercharge a team",
      image: "/tech-copilot.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#221F26]/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#9b87f5]" />
            <span className="text-xl font-semibold">Persona Creator</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleSignOut}
            >
              <UserCircle2 className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-12">
        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card 
              key={feature.title}
              className="bg-white/5 border-0 p-6 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={feature.onClick}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  {feature.icon}
                  <h3 className="text-lg font-medium">{feature.title}</h3>
                </div>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Stock Personas */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Chat with our stock replica personas</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stockPersonas.map((persona) => (
              <Card 
                key={persona.name}
                className="bg-white/5 border-0 p-6"
              >
                <div className="flex flex-col gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700">
                    <img 
                      src={persona.image} 
                      alt={persona.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{persona.name}</h3>
                    <p className="text-sm text-gray-400">{persona.description}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-fit"
                  >
                    Join Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white/5 border-0 p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-gray-800">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">Get started with the API</h3>
              <p className="text-sm text-gray-400">Intuitive docs and APIs make it easy.</p>
            </div>
          </Card>
          
          <Card className="bg-white/5 border-0 p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-gray-800">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">Help center</h3>
              <p className="text-sm text-gray-400">Find answers to frequently asked questions or contact our support team.</p>
            </div>
          </Card>
          
          <Card className="bg-white/5 border-0 p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-gray-800">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">Join community</h3>
              <p className="text-sm text-gray-400">Connect with our developer community.</p>
            </div>
          </Card>
        </div>

        {/* Your Personas */}
        <div className="rounded-lg border border-gray-800 bg-[#221F26] p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Personas</h2>
              <p className="text-gray-400">Create and manage your AI personas</p>
            </div>
            <Button
              onClick={() => navigate("/create-persona")}
              className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Persona
            </Button>
          </div>

          <PersonaList
            personas={personas || []}
            isLoading={isLoading}
            onDeploy={handleDeploy}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;