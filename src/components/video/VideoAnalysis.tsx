import React, { useEffect, useRef, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface VideoAnalysisProps {
  onSpeechDetected: (text: string) => void;
  language?: string;
}

export const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
  onSpeechDetected,
  language = 'en'
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
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
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    } else {
      console.error('Speech recognition not supported in this browser');
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
    };
  }, [language, onSpeechDetected]);

  return null;
};