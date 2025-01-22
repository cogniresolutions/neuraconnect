import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoUploader from '@/components/deployment/VideoUploader';
import APIKeyManager from '@/components/deployment/APIKeyManager';
import ConversationSetup from '@/components/deployment/ConversationSetup';

const PersonalDeployment = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Personal Deployment</h1>
      
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