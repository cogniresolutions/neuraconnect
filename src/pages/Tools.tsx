import { Card } from '@/components/ui/card';
import AzureVoiceTest from '@/components/AzureVoiceTest';

export default function Tools() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-400">
            Developer Tools
          </h1>
          <p className="text-gray-400 mt-2">
            Test and configure your AI services
          </p>
        </div>

        <Card className="p-6 bg-black/20 border-purple-500/20 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-4 text-purple-200">Voice Testing</h2>
          <AzureVoiceTest />
        </Card>
      </div>
    </div>
  );
}