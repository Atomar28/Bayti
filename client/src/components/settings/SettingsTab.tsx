import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VoiceSelectionModal } from "@/components/voice/VoiceSelectionModal";
import { 
  Settings, 
  Volume2, 
  Clock, 
  Globe, 
  Mic, 
  Phone, 
  User,
  Sparkles,
  Save,
  RefreshCw
} from "lucide-react";

interface AgentSettings {
  id: string;
  agentId: string;
  agentName: string;
  voiceType: string;
  elevenLabsVoiceId: string;
  elevenLabsModel: string;
  voiceStability: string;
  voiceSimilarity: string;
  speakingSpeed: string;
  callTimeout: number;
  region: string;
  targetIndustries: string[];
  companySizes: string[];
  minBudget: number;
  maxBudget: number;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  bufferTime: number;
}

export default function SettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  // Mock agent ID - in real app this would come from auth
  const agentId = "mock-agent-id";

  // Fetch current agent settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: [`/api/agent-settings/${agentId}`],
    retry: false,
  });

  // Form state
  const [formData, setFormData] = useState<Partial<AgentSettings>>({
    agentId,
    agentName: "Bayti Assistant",
    voiceType: "Professional Female",
    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
    elevenLabsModel: "eleven_monolingual_v1",
    voiceStability: "0.5",
    voiceSimilarity: "0.8",
    speakingSpeed: "1.0",
    callTimeout: 30,
    region: "North America",
    targetIndustries: ["real_estate"],
    companySizes: ["small", "medium"],
    minBudget: 1000,
    maxBudget: 100000,
    workingHours: {
      start: "09:00",
      end: "17:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    bufferTime: 15,
  });

  // Update form data when settings load
  useState(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
      }));
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AgentSettings>) => {
      return await apiRequest("/api/agent-settings", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your AI agent configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/agent-settings/${agentId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof AgentSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHoursChange = (field: keyof AgentSettings['workingHours'], value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours!,
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    // Create default settings if none exist
    const defaultSettings = {
      agentId,
      agentName: "Bayti Assistant",
      voiceType: "Professional Female",
      elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
      elevenLabsModel: "eleven_monolingual_v1",
      voiceStability: "0.5",
      voiceSimilarity: "0.8",
      speakingSpeed: "1.0",
      callTimeout: 30,
      region: "North America",
      bufferTime: 15,
    };
    
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Set Up Your AI Agent</h3>
            <p className="text-gray-600 mb-4">
              Configure your AI agent settings to get started with Bayti.
            </p>
            <Button 
              onClick={() => saveSettingsMutation.mutate(defaultSettings)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Initialize Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Agent Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            AI Agent Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input
                value={formData.agentName}
                onChange={(e) => handleInputChange('agentName', e.target.value)}
                placeholder="Bayti Assistant"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Current Voice</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                    <Volume2 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">{formData.voiceType}</span>
                    <Badge variant="outline" className="ml-auto">
                      ElevenLabs
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowVoiceModal(true)}
                  className="px-4"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Change Voice
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Speaking Speed</Label>
              <div className="space-y-2">
                <Slider
                  value={[parseFloat(formData.speakingSpeed || "1.0")]}
                  onValueChange={(value) => handleInputChange('speakingSpeed', value[0].toString())}
                  max={2}
                  min={0.5}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Slow</span>
                  <span>{formData.speakingSpeed}x</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Call Timeout (seconds)</Label>
              <Input
                type="number"
                value={formData.callTimeout}
                onChange={(e) => handleInputChange('callTimeout', parseInt(e.target.value))}
                placeholder="30"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => handleInputChange('region', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North America">North America</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                  <SelectItem value="Middle East">Middle East</SelectItem>
                  <SelectItem value="Latin America">Latin America</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours & Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Working Hours & Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.workingHours?.start}
                onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.workingHours?.end}
                onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Appointment Buffer (minutes)</Label>
              <Input
                type="number"
                value={formData.bufferTime}
                onChange={(e) => handleInputChange('bufferTime', parseInt(e.target.value))}
                placeholder="15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <Button
                  key={day}
                  variant={formData.workingHours?.days?.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const currentDays = formData.workingHours?.days || [];
                    const newDays = currentDays.includes(day)
                      ? currentDays.filter(d => d !== day)
                      : [...currentDays, day];
                    handleWorkingHoursChange('days', newDays);
                  }}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Qualification Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            Lead Qualification Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Minimum Budget</Label>
              <Input
                type="number"
                value={formData.minBudget}
                onChange={(e) => handleInputChange('minBudget', parseInt(e.target.value))}
                placeholder="1000"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Maximum Budget</Label>
              <Input
                type="number"
                value={formData.maxBudget}
                onChange={(e) => handleInputChange('maxBudget', parseInt(e.target.value))}
                placeholder="100000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Industries</Label>
            <div className="flex flex-wrap gap-2">
              {['real_estate', 'construction', 'property_management', 'investment', 'commercial'].map((industry) => (
                <Button
                  key={industry}
                  variant={formData.targetIndustries?.includes(industry) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const current = formData.targetIndustries || [];
                    const updated = current.includes(industry)
                      ? current.filter(i => i !== industry)
                      : [...current, industry];
                    handleInputChange('targetIndustries', updated);
                  }}
                >
                  {industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {['small', 'medium', 'large', 'enterprise'].map((size) => (
                <Button
                  key={size}
                  variant={formData.companySizes?.includes(size) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const current = formData.companySizes || [];
                    const updated = current.includes(size)
                      ? current.filter(s => s !== size)
                      : [...current, size];
                    handleInputChange('companySizes', updated);
                  }}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 px-8"
        >
          {saveSettingsMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Voice Selection Modal */}
      <VoiceSelectionModal
        open={showVoiceModal}
        onOpenChange={setShowVoiceModal}
        currentSettings={formData}
      />
    </div>
  );
}