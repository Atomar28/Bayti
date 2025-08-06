import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Volume2, User, Zap, Settings, Sparkles } from "lucide-react";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  labels: {
    accent?: string;
    age?: string;
    gender?: string;
    description?: string;
  };
  settings: {
    stability: number;
    similarity_boost: number;
  };
}

interface Model {
  model_id: string;
  name: string;
  description: string;
  languages: Array<{ language_id: string; name: string }>;
}

interface VoiceSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings?: {
    elevenLabsVoiceId?: string;
    elevenLabsModel?: string;
    voiceStability?: string;
    voiceSimilarity?: string;
    voiceType?: string;
    agentId: string;
  };
}

export function VoiceSelectionModal({ open, onOpenChange, currentSettings }: VoiceSelectionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [stability, setStability] = useState<number[]>([0.5]);
  const [similarity, setSimilarity] = useState<number[]>([0.8]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Fetch available voices
  const { data: voices = [], isLoading: voicesLoading } = useQuery({
    queryKey: ["/api/elevenlabs/voices"],
    enabled: open,
  });

  // Fetch available models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/elevenlabs/models"],
    enabled: open,
  });

  // Test voice mutation
  const testVoiceMutation = useMutation({
    mutationFn: async ({ voiceId, text }: { voiceId: string; text?: string }) => {
      return await apiRequest("/api/elevenlabs/test-voice", {
        method: "POST",
        body: { voiceId, text: text || "Hello, this is a test of the voice quality for your AI agent." }
      });
    },
    onSuccess: (data: any) => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      
      const audio = new Audio(data.audioUrl);
      setCurrentAudio(audio);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
      
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        toast({
          title: "Playback Error",
          description: "Failed to play voice sample",
          variant: "destructive",
        });
        setIsPlaying(false);
      });
    },
    onError: (error: any) => {
      toast({
        title: "Voice Test Failed",
        description: error.message || "Failed to test voice",
        variant: "destructive",
      });
    },
  });

  // Save voice settings mutation
  const saveVoiceSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest("/api/agent-settings", {
        method: "POST",
        body: settings
      });
    },
    onSuccess: () => {
      toast({
        title: "Voice Updated",
        description: "AI agent voice settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-settings"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save voice settings",
        variant: "destructive",
      });
    },
  });

  // Initialize settings when modal opens
  useEffect(() => {
    if (open && currentSettings) {
      const currentVoice = voices.find((v: Voice) => v.voice_id === currentSettings.elevenLabsVoiceId);
      if (currentVoice) {
        setSelectedVoice(currentVoice);
      }
      setSelectedModel(currentSettings.elevenLabsModel || "eleven_monolingual_v1");
      setStability([parseFloat(currentSettings.voiceStability || "0.5")]);
      setSimilarity([parseFloat(currentSettings.voiceSimilarity || "0.8")]);
    }
  }, [open, currentSettings, voices]);

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
    setStability([voice.settings.stability]);
    setSimilarity([voice.settings.similarity_boost]);
  };

  const handleTestVoice = () => {
    if (!selectedVoice) return;
    
    if (isPlaying && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
      setCurrentAudio(null);
      return;
    }
    
    testVoiceMutation.mutate({ voiceId: selectedVoice.voice_id });
  };

  const handleSave = () => {
    if (!selectedVoice || !currentSettings) {
      toast({
        title: "Selection Required",
        description: "Please select a voice first",
        variant: "destructive",
      });
      return;
    }

    const settings = {
      agentId: currentSettings.agentId,
      elevenLabsVoiceId: selectedVoice.voice_id,
      elevenLabsModel: selectedModel,
      voiceStability: stability[0].toString(),
      voiceSimilarity: similarity[0].toString(),
      voiceType: selectedVoice.name,
    };

    saveVoiceSettingsMutation.mutate(settings);
  };

  const getVoiceIcon = (voice: Voice) => {
    if (voice.labels.gender === "male") return <User className="w-4 h-4 text-blue-600" />;
    if (voice.labels.gender === "female") return <User className="w-4 h-4 text-pink-600" />;
    return <Volume2 className="w-4 h-4 text-gray-600" />;
  };

  const getVoiceTypeColor = (category: string) => {
    switch (category) {
      case "premade": return "bg-blue-100 text-blue-800";
      case "cloned": return "bg-purple-100 text-purple-800";
      case "professional": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Voice Selection for AI Agent
          </DialogTitle>
          <DialogDescription>
            Choose the perfect voice for your Bayti AI calling agent. Test voices and adjust settings to match your brand personality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voice Grid */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Available Voices</Label>
            {voicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {voices.map((voice: Voice) => (
                  <Card
                    key={voice.voice_id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedVoice?.voice_id === voice.voice_id 
                        ? "ring-2 ring-purple-500 bg-purple-50" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleVoiceSelect(voice)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getVoiceIcon(voice)}
                          <h3 className="font-medium text-sm">{voice.name}</h3>
                        </div>
                        <Badge className={getVoiceTypeColor(voice.category)}>
                          {voice.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{voice.description}</p>
                      <div className="flex gap-1 flex-wrap">
                        {voice.labels.accent && (
                          <Badge variant="outline" className="text-xs">{voice.labels.accent}</Badge>
                        )}
                        {voice.labels.age && (
                          <Badge variant="outline" className="text-xs">{voice.labels.age}</Badge>
                        )}
                        {voice.labels.gender && (
                          <Badge variant="outline" className="text-xs">{voice.labels.gender}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Voice Settings */}
          {selectedVoice && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Voice Configuration</Label>
              
              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model: Model) => (
                      <SelectItem key={model.model_id} value={model.model_id}>
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stability Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Stability</Label>
                  <span className="text-sm text-gray-500">{stability[0].toFixed(1)}</span>
                </div>
                <Slider
                  value={stability}
                  onValueChange={setStability}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Higher values make the voice more consistent but less expressive
                </p>
              </div>

              {/* Similarity Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Similarity Boost</Label>
                  <span className="text-sm text-gray-500">{similarity[0].toFixed(1)}</span>
                </div>
                <Slider
                  value={similarity}
                  onValueChange={setSimilarity}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Higher values make the voice more similar to the original
                </p>
              </div>

              {/* Test Voice Button */}
              <Button
                onClick={handleTestVoice}
                variant="outline"
                disabled={testVoiceMutation.isPending}
                className="w-full"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {testVoiceMutation.isPending ? "Generating..." : "Test Voice"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!selectedVoice || saveVoiceSettingsMutation.isPending}
          >
            {saveVoiceSettingsMutation.isPending ? "Saving..." : "Save Voice Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}