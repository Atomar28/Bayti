import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SettingsTab() {
  return (
    <div className="space-y-6">
      {/* Settings Configuration Notice */}
      <Card>
        <CardContent className="p-8 text-center">
          <Settings className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-3">AI Agent Settings</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            All AI agent configuration options are now available in the main Settings page. 
            Click the button below to access the comprehensive settings panel where you can configure 
            voice settings, working hours, lead qualification criteria, and more.
          </p>
          <Button 
            onClick={() => window.location.href = '/settings'}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
          >
            <Settings className="w-5 h-5 mr-2" />
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}