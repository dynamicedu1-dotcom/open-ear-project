import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ResponsiveLayout } from '@/layouts/ResponsiveLayout';
import { useIdentity } from '@/contexts/IdentityContext';
import { useMessages, useConversation } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Image, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EmailCaptureModal } from '@/components/EmailCaptureModal';

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('conversation');
  const { profile, isIdentified, requestIdentity, requiresIdentity, cancelIdentityRequest } = useIdentity();
  const { conversations, isLoading: convLoading, getOrCreateConversation } = useMessages();
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationIdParam);
  
  useEffect(() => {
    if (conversationIdParam) {
      setActiveConversation(conversationIdParam);
    }
  }, [conversationIdParam]);

  if (!isIdentified) {
    return (
      <ResponsiveLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <h2 className="text-xl font-semibold mb-2">Sign in to message</h2>
          <p className="text-muted-foreground mb-4">You need to be identified to use messages</p>
        <Button onClick={requestIdentity}>Get Started</Button>
      </div>
      <EmailCaptureModal 
        open={requiresIdentity} 
        onOpenChange={(open) => !open && cancelIdentityRequest()} 
      />
    </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className={cn(
          'w-full md:w-80 border-r flex-shrink-0',
          activeConversation ? 'hidden md:block' : 'block'
        )}>
          <div className="p-4 border-b">
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            {convLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start a conversation from someone's profile</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'p-3 flex gap-3 hover:bg-muted/50 cursor-pointer transition-colors',
                      conv.id === activeConversation && 'bg-muted'
                    )}
                    onClick={() => setActiveConversation(conv.id)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.other_user?.profile_photo_url || ''} />
                      <AvatarFallback>
                        {conv.other_user?.display_name?.[0] || conv.other_user?.unique_id?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium truncate">
                          {conv.other_user?.display_name || conv.other_user?.unique_id || 'Unknown'}
                        </p>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message?.content || (conv.last_message?.image_url ? '📷 Image' : 'No messages')}
                      </p>
                    </div>
                    {(conv.unread_count || 0) > 0 && (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat View */}
        <div className={cn(
          'flex-1 flex flex-col',
          !activeConversation ? 'hidden md:flex' : 'flex'
        )}>
          {activeConversation ? (
            <ChatView 
              conversationId={activeConversation} 
              onBack={() => setActiveConversation(null)}
              conversations={conversations}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
}

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
  conversations: any[];
}

function ChatView({ conversationId, onBack, conversations }: ChatViewProps) {
  const { profile } = useIdentity();
  const { toast } = useToast();
  const { messages, isLoading, sendMessage } = useConversation(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image too large', description: 'Max size is 5MB', variant: 'destructive' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !imageFile) return;

    setIsSending(true);
    let imageUrl = null;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('chat-images')
          .upload(fileName, imageFile);

        if (error) throw error;
        
        const { data: publicUrl } = supabase.storage
          .from('chat-images')
          .getPublicUrl(data.path);
        
        imageUrl = publicUrl.publicUrl;
      }

      await sendMessage(newMessage.trim() || null, imageUrl);
      setNewMessage('');
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Send error:', error);
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation?.other_user?.profile_photo_url || ''} />
          <AvatarFallback>
            {conversation?.other_user?.display_name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {conversation?.other_user?.display_name || conversation?.other_user?.unique_id || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === profile?.id;
              return (
                <div
                  key={msg.id}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2',
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="Shared image"
                        className="rounded-lg max-w-full mb-2"
                      />
                    )}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    <p className={cn(
                      'text-xs mt-1',
                      isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
        >
          <Image className="h-5 w-5" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isSending}
        />
        <Button onClick={handleSend} disabled={isSending || (!newMessage.trim() && !imageFile)}>
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </>
  );
}
