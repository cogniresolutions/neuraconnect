import { useState, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User } from 'lucide-react'
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface AIVideoParticipantProps {
  personaId: string
  isActive: boolean
  onSpeechEnd?: () => void
}

export const AIVideoParticipant = ({ 
  personaId, 
  isActive,
  onSpeechEnd 
}: AIVideoParticipantProps) => {
  const [persona, setPersona] = useState<any>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPersona = async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single()

      if (error) {
        toast({
          title: "Error fetching persona",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setPersona(data)
    }

    fetchPersona()
  }, [personaId, toast])

  useEffect(() => {
    if (!audioElement) {
      const audio = new Audio()
      audio.onended = () => {
        setIsAnimating(false)
        onSpeechEnd?.()
      }
      setAudioElement(audio)
    }
  }, [onSpeechEnd])

  const speak = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('synthesize-voice', {
        body: { text }
      })

      if (error) throw error

      if (audioElement && data.audioContent) {
        setIsAnimating(true)
        audioElement.src = `data:audio/mp3;base64,${data.audioContent}`
        await audioElement.play()
      }
    } catch (error: any) {
      toast({
        title: "Speech synthesis failed",
        description: error.message,
        variant: "destructive",
      })
      setIsAnimating(false)
    }
  }

  if (!persona) return null

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-black/50">
      <Avatar 
        className={cn(
          "w-full h-full rounded-lg transition-transform duration-300",
          isAnimating && "animate-subtle-movement"
        )}
      >
        <AvatarImage 
          src={persona.avatar_url} 
          className="object-cover"
          alt={persona.name}
        />
        <AvatarFallback>
          <User className="w-12 h-12" />
        </AvatarFallback>
      </Avatar>
      
      <div className="absolute bottom-4 left-4 text-white">
        <h3 className="text-lg font-semibold">{persona.name}</h3>
        <p className="text-sm text-white/70">{persona.description}</p>
      </div>
    </div>
  )
}