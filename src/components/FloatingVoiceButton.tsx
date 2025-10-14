import { Mic } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export const FloatingVoiceButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      size="lg"
      className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-accent-glow animate-pulse-glow z-50 gradient-accent"
      onClick={() => navigate("/share")}
    >
      <Mic className="h-6 w-6" />
    </Button>
  );
};
