import { Mic } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useDraggable } from "@/hooks/useDraggable";

export const FloatingVoiceButton = () => {
  const navigate = useNavigate();
  const { position, isDragging, onMouseDown, onTouchStart } = useDraggable({
    storageKey: "voiceButtonPosition",
    defaultPosition: { x: window.innerWidth - 96, y: window.innerHeight - 120 },
  });

  const handleClick = () => {
    if (!isDragging) {
      navigate("/share");
    }
  };

  return (
    <Button
      size="lg"
      className="h-16 w-16 rounded-full shadow-accent-glow z-50 gradient-accent transition-all duration-300"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.8 : 1,
        transform: isDragging ? "scale(1.1)" : "scale(1)",
        animation: isDragging ? "none" : "pulse-glow 2s ease-in-out infinite",
      }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <Mic className="h-6 w-6" />
    </Button>
  );
};
