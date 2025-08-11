import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Plus, Edit, Trash2, Play, Save, Clock, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VoiceSettingsCard } from "@/components/settings/VoiceSettingsCard";
import type { AgentSettings, CallScript } from "@shared/schema";

export default function Settings() {
  const [agentSettings, setAgentSettings] = useState<Partial<AgentSettings>>({
    agentName: "Bayti Assistant",
    voiceType: "Professional Female",
    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
    elevenLabsModelId: "eleven_flash_v2_5",
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.8,
      style: 0,
      speakerBoost: false
    },
    speakingSpeed: "1.0",
    callTimeout: 30,
    targetIndustries: ["Technology", "Real Estate"],
    companySizes: ["Startup (1-10 employees)", "Small Business (11-50 employees)"],
    minBudget: 10000,
    maxBudget: 100000,
    region: "North America",
    workingHours: {
      start: "09:00",
      end: "17:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    bufferTime: 15,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch available voices from AI Voice API
  const { data: voices = [], isLoading: voicesLoading } = useQuery({
    queryKey: ["/api/elevenlabs/voices"],
    retry: 1,
  });

  // Fetch available AI models  
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/elevenlabs/models"],
    retry: 1,
  });

  // Load existing settings
  const { data: existingSettings } = useQuery({
    queryKey: ["/api/agent-settings/default-agent"],
  });

  useEffect(() => {
    if (existingSettings && typeof existingSettings === 'object') {
      console.log("Loading settings from database:", existingSettings);
      setAgentSettings(prev => ({
        ...prev,
        ...existingSettings,
        voiceSettings: (existingSettings as any).voiceSettings || {
          stability: 0.5,
          similarityBoost: 0.8,
          style: 0,
          speakerBoost: false
        }
      }));
      console.log("Voice loaded:", (existingSettings as any).elevenLabsVoiceId);
    }
  }, [existingSettings]);

  const { data: scripts, isLoading: scriptsLoading } = useQuery({
    queryKey: ["/api/call-scripts"],
  });

  // Test voice mutation
  const testVoiceMutation = useMutation({
    mutationFn: async () => {
      if (!agentSettings.elevenLabsVoiceId) {
        throw new Error("No voice selected");
      }
      return await fetch("/api/elevenlabs/test-voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceId: agentSettings.elevenLabsVoiceId,
          text: "Hi",
          modelId: agentSettings.elevenLabsModelId || "eleven_flash_v2_5"
        })
      }).then(res => res.json());
    },
    onSuccess: (data: any) => {
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(error => {
          console.error("Failed to play audio:", error);
          toast({
            title: "Audio Error",
            description: "Could not play voice preview. Please check your audio settings.",
            variant: "destructive",
          });
        });
        toast({
          title: "Voice Test Successful",
          description: "Playing voice preview...",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Voice Test Failed",
        description: error.message || "Could not test voice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Test voice function
  const testVoice = () => {
    if (!agentSettings.elevenLabsVoiceId) {
      toast({
        title: "No Voice Selected",
        description: "Please select a voice before testing.",
        variant: "destructive",
      });
      return;
    }
    testVoiceMutation.mutate();
  };

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<AgentSettings>) => {
      return await fetch("/api/agent-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          agentId: "default-agent"
        })
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-settings/default-agent"] });
      toast({
        title: "Configuration Saved",
        description: "AI voice settings have been updated successfully and synchronized.",
      });
    },
    onError: (error: any) => {
      console.error("Settings save error:", error);
      toast({
        title: "Save Failed",
        description: error?.message || "Could not save voice configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteScriptMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/call-scripts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-scripts"] });
      toast({
        title: "Script deleted",
        description: "Call script has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(agentSettings);
  };

  const handleCompanySizeChange = (size: string, checked: boolean) => {
    const currentSizes = agentSettings.companySizes || [];
    if (checked) {
      setAgentSettings({
        ...agentSettings,
        companySizes: [...currentSizes, size],
      });
    } else {
      setAgentSettings({
        ...agentSettings,
        companySizes: currentSizes.filter(s => s !== size),
      });
    }
  };

  const handleWorkingHoursChange = (field: string, value: any) => {
    setAgentSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours!,
        [field]: value
      }
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setAgentSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full pb-24">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-lg text-gray-600">Configure your AI agent and manage your account</p>
        </div>

        <div className="max-w-4xl">
        {/* User Profile Card - NEW */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">AJ</span>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                    <Input id="fullName" value="Agent John" onChange={() => {}} className="mt-1" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input id="email" value="hello@bayti.com" onChange={() => {}} className="mt-1" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                    <Input id="role" value="Lead AI Agent" onChange={() => {}} className="mt-1" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-sm text-green-600 font-medium">Online & Active</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button size="sm" variant="outline">Update Profile</Button>
                  <Button size="sm" variant="outline">Change Password</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Voice Configuration */}
        <Card className="mb-8 voice-config-card border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              AI Voice Configuration
            </CardTitle>
            <p className="text-gray-600 mt-2">Configure your AI agent's voice characteristics and speech patterns</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Voice Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700">Voice Selection</Label>
                <Select
                  value={agentSettings.elevenLabsVoiceId || ""}
                  onValueChange={(value) => setAgentSettings(prev => ({ ...prev, elevenLabsVoiceId: value }))}
                  disabled={voicesLoading}
                >
                  <SelectTrigger className="h-12 voice-selection-trigger">
                    <SelectValue placeholder="Select voice..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {voicesLoading ? (
                      <SelectItem value="loading">Loading voices...</SelectItem>
                    ) : (
                      Array.isArray(voices) && voices.map((voice: any) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{voice.name}</span>
                            <span className="text-xs text-gray-500">{voice.labels?.gender || 'Unknown'} • {voice.labels?.accent || 'Neutral'}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {agentSettings.elevenLabsVoiceId && (
                  <div className="text-sm text-gray-600 voice-detail-card p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Current Voice Details</div>
                        {Array.isArray(voices) && voices.find((v: any) => v.voice_id === agentSettings.elevenLabsVoiceId) && (
                          <div className="text-xs mt-1">
                            Gender: {(voices.find((v: any) => v.voice_id === agentSettings.elevenLabsVoiceId) as any)?.labels?.gender || 'Unknown'}<br/>
                            Accent: {(voices.find((v: any) => v.voice_id === agentSettings.elevenLabsVoiceId) as any)?.labels?.accent || 'Neutral'}<br/>
                            Age: {(voices.find((v: any) => v.voice_id === agentSettings.elevenLabsVoiceId) as any)?.labels?.age || 'Unknown'}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testVoice()}
                        className="voice-preview-button"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700">AI Voice Model</Label>
                <Select
                  value={agentSettings.elevenLabsModelId || ""}
                  onValueChange={(value) => setAgentSettings(prev => ({ ...prev, elevenLabsModelId: value }))}
                  disabled={modelsLoading}
                >
                  <SelectTrigger className="h-12 voice-selection-trigger">
                    <SelectValue placeholder="Select AI model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsLoading ? (
                      <SelectItem value="loading">Loading models...</SelectItem>
                    ) : (
                      Array.isArray(models) && models.map((model: any) => (
                        <SelectItem key={model.model_id} value={model.model_id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-gray-500">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voice Modulation Settings */}
            <div className="space-y-6 voice-modulation-panel p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice Modulation Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stability */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700">Stability ({(agentSettings.voiceSettings?.stability || 0.5).toFixed(2)})</Label>
                    <span className="text-xs text-gray-500">More stable voices have less variation</span>
                  </div>
                  <Slider
                    value={[agentSettings.voiceSettings?.stability || 0.5]}
                    onValueChange={([value]) => setAgentSettings(prev => ({
                      ...prev,
                      voiceSettings: { 
                        stability: value,
                        similarityBoost: prev.voiceSettings?.similarityBoost || 0.8,
                        style: prev.voiceSettings?.style || 0,
                        speakerBoost: prev.voiceSettings?.speakerBoost || false
                      }
                    }))}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Variable</span>
                    <span>Stable</span>
                  </div>
                </div>

                {/* Similarity Boost */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700">Similarity Boost ({(agentSettings.voiceSettings?.similarityBoost || 0.8).toFixed(2)})</Label>
                    <span className="text-xs text-gray-500">Higher values sound more like original speaker</span>
                  </div>
                  <Slider
                    value={[agentSettings.voiceSettings?.similarityBoost || 0.8]}
                    onValueChange={([value]) => setAgentSettings(prev => ({
                      ...prev,
                      voiceSettings: { 
                        stability: prev.voiceSettings?.stability || 0.5,
                        similarityBoost: value,
                        style: prev.voiceSettings?.style || 0,
                        speakerBoost: prev.voiceSettings?.speakerBoost || false
                      }
                    }))}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full voice-slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              {/* Speaker Boost */}
              <div className="flex items-center justify-between p-4 voice-detail-card rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Speaker Boost</Label>
                  <p className="text-xs text-gray-500 mt-1">Enhances voice similarity to the original speaker</p>
                </div>
                <Checkbox
                  checked={agentSettings.voiceSettings?.speakerBoost || false}
                  onCheckedChange={(checked) => setAgentSettings(prev => ({
                    ...prev,
                    voiceSettings: { 
                      stability: prev.voiceSettings?.stability || 0.5,
                      similarityBoost: prev.voiceSettings?.similarityBoost || 0.8,
                      style: prev.voiceSettings?.style || 0,
                      speakerBoost: !!checked
                    }
                  }))}
                  className="w-5 h-5 voice-checkbox"
                />
              </div>

              {/* Call Timeout */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700">Call Timeout</Label>
                <Select
                  value={agentSettings.callTimeout?.toString() || "30"}
                  onValueChange={(value) => setAgentSettings(prev => ({ ...prev, callTimeout: parseInt(value) }))}
                >
                  <SelectTrigger className="h-12 voice-selection-trigger">
                    <SelectValue placeholder="Select timeout..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="120">120 seconds</SelectItem>
                    <SelectItem value="180">180 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Test Voice Button */}
            <div className="flex justify-center">
              <Button
                onClick={testVoice}
                disabled={testVoiceMutation.isPending || !agentSettings.elevenLabsVoiceId}
                className="px-8 py-3 voice-test-button text-white font-medium rounded-full"
              >
                <Play className="w-5 h-5 mr-2" />
                {testVoiceMutation.isPending ? "Testing Voice..." : "Test Current Voice"}
              </Button>
            </div>

            {/* Save Configuration Button */}
            <div className="pt-6 border-t border-gray-200/50">
              <Button
                onClick={() => saveSettingsMutation.mutate(agentSettings)}
                disabled={saveSettingsMutation.isPending}
                className="w-full py-4 voice-save-button text-white font-semibold rounded-2xl text-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                {saveSettingsMutation.isPending ? "Saving Configuration..." : "Save Voice Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours & Availability */}
        <Card className="mb-8 border-0 shadow-lg">
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
                  value={agentSettings.workingHours?.start}
                  onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={agentSettings.workingHours?.end}
                  onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Appointment Buffer (minutes)</Label>
                <Input
                  type="number"
                  value={agentSettings.bufferTime}
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
                    variant={agentSettings.workingHours?.days?.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const currentDays = agentSettings.workingHours?.days || [];
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
        <Card className="mb-8 border-0 shadow-lg">
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
                  value={agentSettings.minBudget}
                  onChange={(e) => handleInputChange('minBudget', parseInt(e.target.value))}
                  placeholder="1000"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Maximum Budget</Label>
                <Input
                  type="number"
                  value={agentSettings.maxBudget}
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
                    variant={agentSettings.targetIndustries?.includes(industry) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current = agentSettings.targetIndustries || [];
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
                    variant={agentSettings.companySizes?.includes(size) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current = agentSettings.companySizes || [];
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

      </div>
      </div>
      
      {/* Extra spacing to ensure scrollability */}
      <div className="h-32"></div>
    </div>
  );
}
