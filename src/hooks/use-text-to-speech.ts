import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface TextToSpeechOptions {
  voice?: string
  language?: string
}

export const useTextToSpeech = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const speak = async (text: string, options: TextToSpeechOptions = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: options.voice,
          language: options.language
        }
      })

      if (error) throw error

      if (data?.audioContent) {
        // Create and play audio from base64
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`)
        await audio.play()
        return audio
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate speech'
      setError(message)
      console.error('Text-to-speech error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    speak,
    isLoading,
    error
  }
}