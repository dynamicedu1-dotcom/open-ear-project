import React from 'react';
import { ResponsiveLayout } from '@/layouts/ResponsiveLayout';
import { NotificationsList } from '@/components/NotificationsList';
import { useIdentity } from '@/contexts/IdentityContext';
import { Button } from '@/components/ui/button';
import { EmailCaptureModal } from '@/components/EmailCaptureModal';

export default function Notifications() {
  const { isIdentified, requestIdentity, requiresIdentity, cancelIdentityRequest } = useIdentity();

  if (!isIdentified) {
    return (
      <ResponsiveLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <h2 className="text-xl font-semibold mb-2">Sign in to see notifications</h2>
          <p className="text-muted-foreground mb-4">You need to be identified to view your notifications</p>
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
      <div className="max-w-2xl mx-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Notifications</h1>
        </div>
        <NotificationsList />
      </div>
    </ResponsiveLayout>
  );
}
