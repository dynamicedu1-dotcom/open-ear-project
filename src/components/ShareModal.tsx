import { useState } from "react";
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
} from "lucide-react";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceId: string;
  voiceContent: string;
  onReshareSuccess?: () => void;
}

export const ShareModal = ({
  open,
  onOpenChange,
  voiceId,
  voiceContent,
  onReshareSuccess,
}: ShareModalProps) => {
  const { profile, isIdentified } = useIdentity();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [reshareComment, setReshareComment] = useState("");
  const [isResharing, setIsResharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"choose" | "reshare">("choose");

  const shareUrl = `${window.location.origin}/wall?voice=${voiceId}`;
  const shareText = voiceContent.length > 100 
    ? voiceContent.substring(0, 100) + "..." 
    : voiceContent;

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

  const socialLinks = [
    {
      name: "Twitter / X",
      icon: Twitter,
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-[#4267B2]/10 hover:text-[#4267B2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "hover:bg-[#0088cc]/10 hover:text-[#0088cc]",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, "_blank", "width=600,height=400");
  };

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
                <p className="text-sm font-medium mb-3">Share to Social Media</p>
                <div className="grid grid-cols-4 gap-2">
                  {socialLinks.map((social) => (
                    <Button
                      key={social.name}
                      variant="ghost"
                      size="sm"
                      className={`flex flex-col h-auto py-3 gap-1 ${social.color}`}
                      onClick={() => handleSocialShare(social.url)}
                    >
                      <social.icon className="h-5 w-5" />
                      <span className="text-[10px]">{social.name}</span>
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
