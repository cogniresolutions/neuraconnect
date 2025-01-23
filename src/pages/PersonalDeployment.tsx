import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoUploader from '@/components/deployment/VideoUploader';
import APIKeyManager from '@/components/deployment/APIKeyManager';
import ConversationSetup from '@/components/deployment/ConversationSetup';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PersonalDeployment = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Personal Deployment</h1>
      </div>
      
      <Tabs defaultValue="replica" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="replica">Create Replica</TabsTrigger>
          <TabsTrigger value="conversation">Create Conversation</TabsTrigger>
          <TabsTrigger value="apikey">Manage API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="replica">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Create Your Digital Replica</h2>
            <VideoUploader />
          </Card>
        </TabsContent>

        <TabsContent value="conversation">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Setup Conversation</h2>
            <ConversationSetup />
          </Card>
        </TabsContent>

        <TabsContent value="apikey">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">API Key Management</h2>
            <APIKeyManager />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalDeployment;