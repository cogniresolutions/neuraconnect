import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function APIDocumentation() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">API Documentation</h2>
        
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-semibold mb-2">Create Persona</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new digital persona with optional training data.
            </p>
            
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <pre className="text-sm">
{`curl --request POST \\
  --url https://kzubwatryfgonzuzldej.supabase.co/functions/v1/api-personas \\
  --header 'Authorization: Bearer <api_key>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "name": "John",
    "training_data_url": "https://example.com/training-data",
    "profile_picture": "https://example.com/profile.png"
  }'`}
              </pre>
            </ScrollArea>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Start Conversation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Initialize a new conversation session with a persona.
            </p>
            
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <pre className="text-sm">
{`const response = await fetch(
  'https://kzubwatryfgonzuzldej.supabase.co/functions/v1/api-conversations/start',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <api_key>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      persona_id: '12345',
      conversation_context: 'Discussing AI innovations'
    })
  }
);
const data = await response.json();
console.log(data);`}
              </pre>
            </ScrollArea>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Get Conversation History</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Retrieve the conversation history for a user.
            </p>
            
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <pre className="text-sm">
{`const response = await fetch(
  'https://kzubwatryfgonzuzldej.supabase.co/functions/v1/api-conversations/history',
  {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer <api_key>'
    }
  }
);
const data = await response.json();
console.log(data);`}
              </pre>
            </ScrollArea>
          </section>
        </div>
      </Card>
    </div>
  );
}