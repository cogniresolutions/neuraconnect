import VideoChat from "@/components/VideoChat";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import { useState } from "react";
import { sendMessageToAI } from "@/lib/azure-openai";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      const response = await sendMessageToAI(message);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chatgpt-main">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Chat Interface */}
          <div className="bg-chatgpt-sidebar rounded-lg p-4">
            <div className="h-[60vh] overflow-y-auto mb-4">
              <MessageList messages={messages} />
            </div>
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          </div>

          {/* Right Column - Video Chat */}
          <div className="space-y-4">
            <div className="flex justify-end">
              <Link to="/create-persona">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Persona
                </Button>
              </Link>
            </div>
            <div className="bg-chatgpt-sidebar rounded-lg p-4">
              <VideoChat />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;