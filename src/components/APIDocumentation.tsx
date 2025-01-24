import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function APIDocumentation() {
  const { toast } = useToast();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied",
      description: "The code has been copied to your clipboard.",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-4">Digital Twin API Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to the Digital Twin API documentation. This guide will help you integrate digital personas into your applications.
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="personas">Personas API</TabsTrigger>
          <TabsTrigger value="conversations">Conversations API</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Getting Started Guide</h2>
            
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-semibold mb-2">1. Get Your API Key</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate an API key from your dashboard to authenticate your requests.
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md text-sm">
                    <code>
                      curl --request POST \
                      --url https://kzubwatryfgonzuzldej.supabase.co/functions/v1/generate-api-key \
                      --header 'Authorization: Bearer YOUR_JWT_TOKEN'
                    </code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyCode(`curl --request POST \\
  --url https://kzubwatryfgonzuzldej.supabase.co/functions/v1/generate-api-key \\
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">2. Create a Digital Twin</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first digital twin by providing basic information and optional training data.
                </p>
                <div className="relative">
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="text-sm">
{`// JavaScript Example
const response = await fetch(
  'https://kzubwatryfgonzuzldej.supabase.co/functions/v1/api-personas',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Assistant Name',
      description: 'A helpful digital twin',
      voiceStyle: 'natural',
      language: 'en'
    })
  }
);`}
                    </pre>
                  </ScrollArea>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyCode(`const response = await fetch(
  'https://kzubwatryfgonzuzldej.supabase.co/functions/v1/api-personas',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Assistant Name',
      description: 'A helpful digital twin',
      voiceStyle: 'natural',
      language: 'en'
    })
  }
);`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">3. Start a Conversation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Initialize a conversation session with your digital twin.
                </p>
                <div className="relative">
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="text-sm">
{`// JavaScript Example
const response = await fetch(
  'https://kzubwatryfgonzuzldej.supabase.co/functions/v1/api-conversations/start',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personaId: 'PERSONA_ID',
      context: 'Initial conversation context'
    })
  }
);`}
                    </pre>
                  </ScrollArea>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyCode(`const response = await fetch(
  'https://kzubwatryfgonzuzldej.supabase.co/functions/v1/api-conversations/start',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personaId: 'PERSONA_ID',
      context: 'Initial conversation context'
    })
  }
);`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </section>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="personas" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Personas API Reference</h2>
            
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-2">Create Persona</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new digital persona with optional training data.
                </p>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Endpoint</h4>
                      <code className="text-sm">POST /api-personas</code>
                    </div>
                    <div>
                      <h4 className="font-semibold">Parameters</h4>
                      <pre className="text-sm">
{`{
  "name": "string (required)",
  "description": "string (optional)",
  "voiceStyle": "string (optional)",
  "language": "string (optional)",
  "trainingData": "string (optional)",
  "profilePicture": "string (optional)"
}`}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold">Response</h4>
                      <pre className="text-sm">
{`{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "created_at": "timestamp"
  }
}`}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </section>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Conversations API Reference</h2>
            
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-2">Start Conversation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Initialize a new conversation session with a persona.
                </p>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Endpoint</h4>
                      <code className="text-sm">POST /api-conversations/start</code>
                    </div>
                    <div>
                      <h4 className="font-semibold">Parameters</h4>
                      <pre className="text-sm">
{`{
  "personaId": "uuid (required)",
  "context": "string (optional)",
  "language": "string (optional)"
}`}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold">Response</h4>
                      <pre className="text-sm">
{`{
  "success": true,
  "data": {
    "conversationId": "string",
    "status": "string",
    "created_at": "timestamp"
  }
}`}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </section>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
            
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-2">Python Example</h3>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <pre className="text-sm">
{`import requests

API_KEY = 'your_api_key'
BASE_URL = 'https://kzubwatryfgonzuzldej.supabase.co/functions/v1'

def create_persona():
    url = f"{BASE_URL}/api-personas"
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    data = {
        'name': 'Assistant Name',
        'description': 'A helpful digital twin',
        'voiceStyle': 'natural',
        'language': 'en'
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()

def start_conversation(persona_id):
    url = f"{BASE_URL}/api-conversations/start"
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    data = {
        'personaId': persona_id,
        'context': 'Initial conversation'
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()`}
                  </pre>
                </ScrollArea>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">Node.js Example</h3>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <pre className="text-sm">
{`const axios = require('axios');

const API_KEY = 'your_api_key';
const BASE_URL = 'https://kzubwatryfgonzuzldej.supabase.co/functions/v1';

async function createPersona() {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/api-personas\`,
      {
        name: 'Assistant Name',
        description: 'A helpful digital twin',
        voiceStyle: 'natural',
        language: 'en'
      },
      {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating persona:', error);
    throw error;
  }
}`}
                  </pre>
                </ScrollArea>
              </section>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
