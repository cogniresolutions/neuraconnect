import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Documentation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const codeExamples = {
    javascript: `const response = await fetch('/api/personas/create', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify({
    name: 'John AI',
    description: 'A helpful AI assistant',
    voice_style: 'natural',
    language: 'en-US'
  }),
});
const data = await response.json();`,
    python: `import requests

url = "https://api.yourdomain.com/personas/create"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}
payload = {
    "name": "John AI",
    "description": "A helpful AI assistant",
    "voice_style": "natural",
    "language": "en-US"
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    curl: `curl --request POST \\
  --url https://api.yourdomain.com/personas/create \\
  --header 'Authorization: Bearer YOUR_API_TOKEN' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "name": "John AI",
    "description": "A helpful AI assistant",
    "voice_style": "natural",
    "language": "en-US"
  }'`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">API Documentation</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <Card>
            <CardHeader>
              <CardTitle>API Authentication</CardTitle>
              <CardDescription>
                All API requests must include your API token in the Authorization header.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg">
                Authorization: Bearer YOUR_API_TOKEN
              </pre>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Persona Management</h2>
          <Tabs defaultValue="javascript" className="w-full">
            <TabsList>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Create Persona</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(code)}
                      >
                        Copy
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Create a new AI persona with custom attributes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                      {code}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Response Format</h2>
          <Card>
            <CardHeader>
              <CardTitle>Success Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg">
{`{
  "success": true,
  "data": {
    "id": "persona-uuid",
    "name": "John AI",
    "description": "A helpful AI assistant",
    "voice_style": "natural",
    "language": "en-US",
    "created_at": "2024-02-20T12:00:00Z"
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Documentation;