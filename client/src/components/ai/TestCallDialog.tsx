import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Phone, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TestCallDialogProps {
  children: React.ReactNode;
}

export function TestCallDialog({ children }: TestCallDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const makeCallMutation = useMutation({
    mutationFn: async (data: { to_number: string }) => {
      return await apiRequest("POST", "/api/ai/make-test-call", data);
    },
    onSuccess: (result) => {
      toast({
        title: "Test call initiated",
        description: `Call started with SID: ${result.call_sid}`,
      });
      setIsOpen(false);
      setPhoneNumber("");
    },
    onError: (error) => {
      toast({
        title: "Call failed",
        description: error.message || "Failed to initiate test call",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    makeCallMutation.mutate({ to_number: phoneNumber });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            Start Test Call
          </DialogTitle>
          <DialogDescription>
            Make a test call to see Bayti AI in action. Enter a verified phone number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="col-span-3"
              />
              <p className="text-xs text-gray-500">
                Use a verified phone number in your Twilio account
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={makeCallMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={makeCallMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {makeCallMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Call
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}