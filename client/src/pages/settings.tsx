import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AgentSettings, CallScript } from "@shared/schema";

export default function Settings() {
  const [agentSettings, setAgentSettings] = useState<Partial<AgentSettings>>({
    agentName: "Bayti Assistant",
    voiceType: "Professional Female",
    speakingSpeed: "1.0",
    callTimeout: 30,
    targetIndustries: ["Technology", "Real Estate"],
    companySizes: ["Startup (1-10 employees)", "Small Business (11-50 employees)"],
    minBudget: 10000,
    maxBudget: 100000,
    region: "North America",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: scripts, isLoading: scriptsLoading } = useQuery({
    queryKey: ["/api/call-scripts"],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<AgentSettings>) => {
      return await apiRequest("POST", "/api/agent-settings", {
        ...settings,
        agentId: "default-agent", // In a real app, this would be the current user's ID
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Agent settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
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

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full">
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
                    <Input id="fullName" value="Agent John" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input id="email" value="hello@bayti.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                    <Input id="role" value="Lead AI Agent" className="mt-1" />
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

        {/* Agent Settings */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">AI Agent Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  value={agentSettings.agentName || ""}
                  onChange={(e) =>
                    setAgentSettings({ ...agentSettings, agentName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="voiceType">Voice Type</Label>
                <Select
                  value={agentSettings.voiceType || ""}
                  onValueChange={(value) =>
                    setAgentSettings({ ...agentSettings, voiceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional Female">Professional Female</SelectItem>
                    <SelectItem value="Professional Male">Professional Male</SelectItem>
                    <SelectItem value="Casual Female">Casual Female</SelectItem>
                    <SelectItem value="Casual Male">Casual Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Speaking Speed</Label>
                <div className="mt-2">
                  <Slider
                    value={[parseFloat(agentSettings.speakingSpeed || "1.0")]}
                    onValueChange={(value) =>
                      setAgentSettings({ ...agentSettings, speakingSpeed: value[0].toString() })
                    }
                    min={0.7}
                    max={1.3}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="callTimeout">Call Timeout (seconds)</Label>
                <Input
                  id="callTimeout"
                  type="number"
                  value={agentSettings.callTimeout || 30}
                  onChange={(e) =>
                    setAgentSettings({ ...agentSettings, callTimeout: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Scripts */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Call Scripts</CardTitle>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Script
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scriptsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : scripts?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No call scripts found</p>
            ) : (
              <div className="space-y-4">
                {scripts?.map((script: CallScript) => (
                  <div key={script.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{script.name}</h4>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScriptMutation.mutate(script.id)}
                          disabled={deleteScriptMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{script.description}</p>
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                      {script.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Audience Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Target Audience Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Industry Focus</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size</Label>
                <div className="space-y-2 mt-2">
                  {[
                    "Startup (1-10 employees)",
                    "Small Business (11-50 employees)",
                    "Medium Business (51-200 employees)",
                    "Enterprise (200+ employees)",
                  ].map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={size}
                        checked={agentSettings.companySizes?.includes(size) || false}
                        onCheckedChange={(checked) =>
                          handleCompanySizeChange(size, checked as boolean)
                        }
                      />
                      <Label htmlFor={size} className="text-sm">
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Budget Range</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={agentSettings.minBudget || ""}
                    onChange={(e) =>
                      setAgentSettings({ ...agentSettings, minBudget: parseInt(e.target.value) })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={agentSettings.maxBudget || ""}
                    onChange={(e) =>
                      setAgentSettings({ ...agentSettings, maxBudget: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="region">Geographic Region</Label>
                <Select
                  value={agentSettings.region}
                  onValueChange={(value) =>
                    setAgentSettings({ ...agentSettings, region: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6">
              <Button
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                className="bg-brand-500 hover:bg-brand-600"
              >
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
