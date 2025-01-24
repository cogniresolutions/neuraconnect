import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PersonaList } from "@/components/persona/PersonaList";
import { Book } from "lucide-react";

export function Sidebar() {
  return (
    <div className="pb-12 w-full">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Digital Personas
          </h2>
          <div className="space-y-1">
            <Link to="/tools" className="w-full">
              <Button variant="ghost" className="w-full justify-start">
                <Book className="mr-2 h-4 w-4" />
                API Documentation
              </Button>
            </Link>
            <Link to="/personas" className="w-full">
              <Button variant="ghost" className="w-full justify-start">
                <Book className="mr-2 h-4 w-4" />
                Manage Personas
              </Button>
            </Link>
            <Link to="/conversations" className="w-full">
              <Button variant="ghost" className="w-full justify-start">
                <Book className="mr-2 h-4 w-4" />
                Manage Conversations
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
