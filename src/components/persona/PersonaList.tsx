import { PersonaCard } from '../PersonaCard';

interface Persona {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
}

interface PersonaListProps {
  personas: Persona[];
  onDelete: (id: string) => Promise<void>;
}

export const PersonaList = ({ personas, onDelete }: PersonaListProps) => {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {personas.map((persona) => (
        <PersonaCard
          key={persona.id}
          id={persona.id}
          name={persona.name}
          description={persona.description}
          status={persona.status}
        />
      ))}
    </div>
  );
};