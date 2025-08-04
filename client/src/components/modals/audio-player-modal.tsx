import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";
import { format } from "date-fns";
import type { CallLog } from "@shared/schema";

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallLog | null;
}

export default function AudioPlayerModal({ isOpen, onClose, call }: AudioPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleDownload = () => {
    if (call?.recordingUrl) {
      const a = document.createElement('a');
      a.href = call.recordingUrl;
      a.download = `call-recording-${call.phoneNumber}-${call.startTime}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!call) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Call Recording</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{call.phoneNumber}</span>
              <span className="text-xs text-gray-500">
                {call.startTime 
                  ? format(new Date(call.startTime), "MMM dd, yyyy - h:mm a")
                  : "Unknown date"}
              </span>
            </div>

            {call.recordingUrl ? (
              <>
                <audio
                  ref={audioRef}
                  src={call.recordingUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
                
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handlePlayPause}
                    size="sm"
                    className="w-10 h-10 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center text-white"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-500 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No recording available for this call</p>
              </div>
            )}
          </div>

          {call.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Summary</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{call.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
