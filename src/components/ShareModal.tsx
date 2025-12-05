import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIdentity } from "@/hooks/useIdentity";
import { EmailCaptureModal } from "./EmailCaptureModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Repeat2,
  Link2,
  Twitter,
  Facebook,
  MessageCircle,
  Send,
  Copy,
  Check,
  Instagram,
  Download,
} from "lucide-react";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceId: string;
  voiceContent: string;
  voiceMood?: string;
  voiceCategory?: string;
  onReshareSuccess?: () => void;
}

export const ShareModal = ({
  open,
  onOpenChange,
  voiceId,
  voiceContent,
  voiceMood = "💭",
  voiceCategory = "General",
  onReshareSuccess,
}: ShareModalProps) => {
  const { profile, isIdentified } = useIdentity();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [reshareComment, setReshareComment] = useState("");
  const [isResharing, setIsResharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"choose" | "reshare">("choose");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const shareUrl = `${window.location.origin}/wall?voice=${voiceId}`;

  const handleReshare = async () => {
    if (!isIdentified) {
      setShowEmailModal(true);
      return;
    }

    if (!profile?.id) return;
    setIsResharing(true);

    try {
      const { error } = await supabase.from("voice_reshares").insert({
        voice_id: voiceId,
        user_profile_id: profile.id,
        comment: reshareComment || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You already reshared this voice");
        } else {
          throw error;
        }
      } else {
        toast.success("Voice reshared!");
        onReshareSuccess?.();
      }
      onOpenChange(false);
      setReshareComment("");
      setMode("choose");
    } catch (error) {
      console.error("Reshare error:", error);
      toast.error("Failed to reshare");
    } finally {
      setIsResharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Generate shareable image
  const generateShareImage = async (): Promise<Blob | null> => {
    setIsGeneratingImage(true);
    
    try {
      // Create a canvas-based image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set canvas dimensions for social media (1080x1080 for Instagram)
      canvas.width = 1080;
      canvas.height = 1080;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.beginPath();
      ctx.arc(100, 100, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width - 100, canvas.height - 100, 250, 0, Math.PI * 2);
      ctx.fill();

      // Mood emoji (large)
      ctx.font = '120px serif';
      ctx.textAlign = 'center';
      ctx.fillText(voiceMood, canvas.width / 2, 200);

      // Category badge
      ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
      const categoryText = voiceCategory;
      ctx.font = 'bold 28px system-ui';
      const categoryWidth = ctx.measureText(categoryText).width + 40;
      ctx.roundRect((canvas.width - categoryWidth) / 2, 240, categoryWidth, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(categoryText, canvas.width / 2, 275);

      // Main content
      ctx.fillStyle = '#ffffff';
      ctx.font = '36px system-ui';
      ctx.textAlign = 'center';
      
      // Word wrap the content
      const maxWidth = canvas.width - 160;
      const lineHeight = 50;
      const words = voiceContent.split(' ');
      let line = '';
      let y = 400;
      const lines: string[] = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());

      // Limit lines and add ellipsis if needed
      const maxLines = 8;
      if (lines.length > maxLines) {
        lines.length = maxLines;
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -3) + '...';
      }

      // Center the text block vertically
      const totalHeight = lines.length * lineHeight;
      y = (canvas.height - totalHeight) / 2 + 50;

      for (const textLine of lines) {
        ctx.fillText(textLine, canvas.width / 2, y);
        y += lineHeight;
      }

      // Branding at bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 24px system-ui';
      ctx.fillText('Dynamic Edu • Your Voice', canvas.width / 2, canvas.height - 80);
      ctx.font = '18px system-ui';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(shareUrl, canvas.width / 2, canvas.height - 45);

      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Download image
  const handleDownloadImage = async () => {
    const blob = await generateShareImage();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-${voiceId.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded! Share it on your favorite platform.");
    } else {
      toast.error("Failed to generate image");
    }
  };

  // Native share with image
  const handleNativeShare = async (platform: string) => {
    const blob = await generateShareImage();
    
    if (!blob) {
      toast.error("Failed to generate image");
      return;
    }

    const file = new File([blob], 'voice-share.png', { type: 'image/png' });
    const shareData = {
      files: [file],
      title: 'Dynamic Edu - Your Voice',
      text: voiceContent.substring(0, 100) + (voiceContent.length > 100 ? '...' : ''),
    };

    // Check if native share is available with files
    if (navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
        return;
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    }

    // Fallback: download image and show instructions
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-${voiceId.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const instructions: Record<string, string> = {
      twitter: "Image downloaded! Open Twitter/X and create a new post with this image.",
      facebook: "Image downloaded! Open Facebook and create a new post with this image.",
      whatsapp: "Image downloaded! Open WhatsApp and share this image in a chat.",
      telegram: "Image downloaded! Open Telegram and share this image in a chat.",
      instagram: "Image downloaded! Open Instagram and share this image as a Story or Post.",
    };

    toast.success(instructions[platform] || "Image downloaded! Share it on your favorite platform.");
  };

  const socialLinks = [
    {
      name: "Twitter / X",
      icon: Twitter,
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
      platform: "twitter",
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-[#4267B2]/10 hover:text-[#4267B2]",
      platform: "facebook",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
      platform: "whatsapp",
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "hover:bg-[#E4405F]/10 hover:text-[#E4405F]",
      platform: "instagram",
    },
    {
      name: "Telegram",
      icon: Send,
      color: "hover:bg-[#0088cc]/10 hover:text-[#0088cc]",
      platform: "telegram",
    },
  ];

  const handleEmailCaptureSuccess = () => {
    setShowEmailModal(false);
    handleReshare();
  };

  return (
    <>
      <EmailCaptureModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        onSuccess={handleEmailCaptureSuccess}
        actionDescription="reshare this post"
      />

      <Dialog open={open} onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setMode("choose");
          setReshareComment("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "choose" ? "Share this Voice" : "Reshare with Comment"}
            </DialogTitle>
          </DialogHeader>

          {mode === "choose" ? (
            <div className="space-y-4">
              {/* Reshare Option */}
              <Button
                variant="outline"
                className="w-full h-auto py-4 justify-start gap-3"
                onClick={() => setMode("reshare")}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Repeat2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Reshare on Wall</p>
                  <p className="text-xs text-muted-foreground">
                    Share to your followers with an optional comment
                  </p>
                </div>
              </Button>

              {/* Download Image */}
              <Button
                variant="outline"
                className="w-full h-auto py-4 justify-start gap-3"
                onClick={handleDownloadImage}
                disabled={isGeneratingImage}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Download className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">
                    {isGeneratingImage ? "Generating..." : "Download as Image"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Save image to share anywhere
                  </p>
                </div>
              </Button>

              {/* Copy Link */}
              <Button
                variant="outline"
                className="w-full h-auto py-4 justify-start gap-3"
                onClick={handleCopyLink}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium">Copy Link</p>
                  <p className="text-xs text-muted-foreground">
                    Copy link to clipboard
                  </p>
                </div>
              </Button>

              {/* Social Media Options */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Share as Image to Social Media</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Creates a beautiful image card and downloads it for sharing
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {socialLinks.map((social) => (
                    <Button
                      key={social.name}
                      variant="ghost"
                      size="sm"
                      className={`flex flex-col h-auto py-3 gap-1 ${social.color}`}
                      onClick={() => handleNativeShare(social.platform)}
                      disabled={isGeneratingImage}
                    >
                      <social.icon className="h-5 w-5" />
                      <span className="text-[10px]">{social.name.split(' ')[0]}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {voiceContent}
                </p>
              </div>

              {/* Comment Input */}
              <Textarea
                placeholder="Add a comment (optional)..."
                value={reshareComment}
                onChange={(e) => setReshareComment(e.target.value)}
                className="min-h-[80px]"
                maxLength={280}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reshareComment.length}/280
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("choose")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleReshare}
                  disabled={isResharing}
                  className="flex-1"
                >
                  {isResharing ? "Resharing..." : "Reshare"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
