import VideoChat from "@/components/VideoChat";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import PersonaCreator from "@/components/PersonaCreator";
import { useState } from "react";
import { sendMessageToAI } from "@/lib/azure-openai";
import { useToast } from "@/hooks/use-toast";

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
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              <MessageList messages={messages} />
            </div>
            <div className="p-4">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-center justify-start p-4 overflow-y-auto">
            <PersonaCreator />
            <div className="mt-8">
              <VideoChat />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;