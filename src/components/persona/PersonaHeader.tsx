import { Button } from "@/components/ui/button";
import { Settings, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brain } from "lucide-react";
import AzureTest from '../AzureTest';
import { PersonaActions } from "./PersonaActions";

interface PersonaHeaderProps {
  onSignOut: () => Promise<void>;
}

export const PersonaHeader = ({ onSignOut }: PersonaHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-400">
          Create Your Persona
        </h1>
        <p className="text-gray-400 mt-2">Design and customize your AI companion</p>
      </div>
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="bg-white/10 border-purple-400/30"
          asChild
        >
          <Link to="/tools">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white/10 border-purple-400/30">
              <Settings className="h-4 w-4 mr-2" />
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Developer Tools</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Brain className="mr-2 h-4 w-4" />
                    Test Azure AI Services
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-black/95">
                  <SheetHeader>
                    <SheetTitle className="text-white">Azure Services Test</SheetTitle>
                    <SheetDescription className="text-gray-400">
                      Test the connection to Azure AI services and verify their functionality.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <AzureTest />
                  </div>
                </SheetContent>
              </Sheet>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <PersonaActions onSignOut={onSignOut} />
      </div>
    </div>
  );
};