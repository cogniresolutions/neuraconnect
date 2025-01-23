import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AzureTest from '@/components/AzureTest';

export default function Tools() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Tools</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Azure Services Test</h2>
          <AzureTest />
        </section>
      </div>
    </div>
  );
}