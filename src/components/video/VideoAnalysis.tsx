import React, { useEffect, useRef, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoAnalysisProps {
  onSpeechDetected: (text: string) => void;
  onAnalysisComplete?: (analysis: any) => void;
  personaId?: string;
  language?: string;
}

export const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
  onSpeechDetected,
  onAnalysisComplete,
  personaId,
  language = 'en'
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const startRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Recognition already started, attempting to restart');
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        } catch (stopError) {
          console.error('Error stopping recognition:', stopError);
        }
      }
    }
  };

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Automatically restart recognition after a short delay
        retryTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            console.log('Restarting speech recognition');
            startRecognition();
          }
        }, 1000);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          // Don't show toast for no-speech error, just restart
          startRecognition();
        } else {
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. Attempting to restart...`,
            variant: "destructive",
          });
          
          // For other errors, restart after a longer delay
          retryTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              startRecognition();
            }
          }, 2000);
        }
      };

      recognition.onresult = async (event: any) => {
        if (event.results && event.results.length > 0) {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          
          // Translate text if not in English
          if (language !== 'en') {
            try {
              const { data: translatedData, error } = await supabase.functions.invoke('azure-translate', {
                body: { text: transcript, targetLanguage: 'en' }
              });
              
              if (!error && translatedData) {
                onSpeechDetected(translatedData.translatedText);
              } else {
                onSpeechDetected(transcript);
              }
            } catch (error) {
              console.error('Translation error:', error);
              onSpeechDetected(transcript);
            }
          } else {
            onSpeechDetected(transcript);
          }
        }
      };

      // Start recognition
      startRecognition();
    } else {
      console.error('Speech recognition not supported in this browser');
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
    }

    // Cleanup
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
    };
  }, [language, onSpeechDetected, toast]);

  return null;
};