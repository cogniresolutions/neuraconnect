import PersonaCreator from "@/components/PersonaCreator";
import PersonaList from "@/components/PersonaList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const CreatePersona = () => {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Video Chat
            </Button>
          </Link>
        </div>
        <PersonaCreator />
        <div className="mt-8">
          <PersonaList />
        </div>
      </div>
    </div>
  );
};

export default CreatePersona;