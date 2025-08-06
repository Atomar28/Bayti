import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play, Volume2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceSettingsCardProps {
  voices: Array<{
    voice_id: string;
    name: string;
    description: string;
    labels: Record<string, string>;
    settings: {
      stability: number;
      similarity_boost: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
  }>;
  models: Array<{
    model_id: string;
    name: string;
    description: string;
    can_use_style: boolean;
    can_use_speaker_boost: boolean;
  }>;
  settings: {
    elevenLabsVoiceId?: string;
    elevenLabsModel?: string;
    voiceSettings?: {
      stability: number;
      similarityBoost: number;
      style?: number;
      speakerBoost?: boolean;
    };
  };
  onSettingsChange: (newSettings: any) => void;
}

export function VoiceSettingsCard({ voices, models, settings, onSettingsChange }: VoiceSettingsCardProps) {
  const { toast } = useToast();
  
  const selectedVoice = voices.find(v => v.voice_id === settings.elevenLabsVoiceId);
  const selectedModel = models.find(m => m.model_id === settings.elevenLabsModel);
  
  const voiceSettings = settings.voiceSettings || {
    stability: selectedVoice?.settings.stability || 0.5,
    similarityBoost: selectedVoice?.settings.similarity_boost || 0.8,
    style: selectedVoice?.settings.style || 0,
    speakerBoost: selectedVoice?.settings.use_speaker_boost || false
  };

  const testVoiceMutation = useMutation({
    mutationFn: async ({ voiceId, text }: { voiceId: string; text: string }) => {
      const response = await apiRequest("POST", "/api/elevenlabs/test-voice", { voiceId, text });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(console.error);
      }
      toast({
        title: "Voice Test",
        description: "Playing voice sample...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Voice Test Failed",
        description: error?.message || "Could not test voice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVoiceChange = (voiceId: string) => {
    const voice = voices.find(v => v.voice_id === voiceId);
    if (voice) {
      onSettingsChange({
        ...settings,
        elevenLabsVoiceId: voiceId,
        voiceSettings: {
          stability: voice.settings.stability,
          similarityBoost: voice.settings.similarity_boost,
          style: voice.settings.style || 0,
          speakerBoost: voice.settings.use_speaker_boost || false
        }
      });
    }
  };

  const handleVoiceSettingChange = (key: string, value: number | boolean) => {
    const newVoiceSettings = {
      ...voiceSettings,
      [key]: value
    };
    onSettingsChange({
      ...settings,
      voiceSettings: newVoiceSettings
    });
  };

  const testCurrentVoice = () => {
    if (settings.elevenLabsVoiceId) {
      testVoiceMutation.mutate({
        voiceId: settings.elevenLabsVoiceId,
        text: "Hello! This is a test of the current voice configuration. How does this sound for your AI calling agent?"
      });
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          ElevenLabs Voice Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="voiceId">Voice Selection</Label>
            <Select
              value={settings.elevenLabsVoiceId || ""}
              onValueChange={handleVoiceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-gray-500">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoice && (
              <div className="mt-2 text-xs text-gray-600">
                <div>Gender: {selectedVoice.labels.gender || 'N/A'}</div>
                <div>Accent: {selectedVoice.labels.accent || 'N/A'}</div>
                <div>Age: {selectedVoice.labels.age || 'N/A'}</div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="modelId">Voice Model</Label>
            <Select
              value={settings.elevenLabsModel || ""}
              onValueChange={(value) => onSettingsChange({...settings, elevenLabsModel: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.model_id} value={model.model_id}>
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-xs text-gray-500">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Voice Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stability */}
            <div>
              <Label>Stability ({voiceSettings.stability.toFixed(2)})</Label>
              <p className="text-xs text-gray-500 mb-2">More stable voices have less variation but may sound less dynamic</p>
              <Slider
                value={[voiceSettings.stability]}
                onValueChange={(value) => handleVoiceSettingChange('stability', value[0])}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Variable</span>
                <span>Stable</span>
              </div>
            </div>

            {/* Similarity Boost */}
            <div>
              <Label>Similarity Boost ({voiceSettings.similarityBoost.toFixed(2)})</Label>
              <p className="text-xs text-gray-500 mb-2">Higher values make the voice sound more like the original speaker</p>
              <Slider
                value={[voiceSettings.similarityBoost]}
                onValueChange={(value) => handleVoiceSettingChange('similarityBoost', value[0])}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Style (if supported by model) */}
            {selectedModel?.can_use_style && (
              <div>
                <Label>Style ({voiceSettings.style?.toFixed(2) || '0.00'})</Label>
                <p className="text-xs text-gray-500 mb-2">Controls the emotional expressiveness of the voice</p>
                <Slider
                  value={[voiceSettings.style || 0]}
                  onValueChange={(value) => handleVoiceSettingChange('style', value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Neutral</span>
                  <span>Expressive</span>
                </div>
              </div>
            )}

            {/* Speaker Boost (if supported by model) */}
            {selectedModel?.can_use_speaker_boost && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Speaker Boost</Label>
                  <p className="text-xs text-gray-500">Enhances voice similarity to the original speaker</p>
                </div>
                <Switch
                  checked={voiceSettings.speakerBoost || false}
                  onCheckedChange={(checked) => handleVoiceSettingChange('speakerBoost', checked)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Test Voice */}
        <div className="pt-4 border-t">
          <Button
            onClick={testCurrentVoice}
            disabled={!settings.elevenLabsVoiceId || testVoiceMutation.isPending}
            className="w-full md:w-auto flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {testVoiceMutation.isPending ? "Testing Voice..." : "Test Current Voice"}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Click to hear how the voice sounds with current settings
          </p>
        </div>
      </CardContent>
    </Card>
  );
}