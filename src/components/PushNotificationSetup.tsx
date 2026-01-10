import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface PushNotificationSetupProps {
  compact?: boolean;
}

export function PushNotificationSetup({ compact = false }: PushNotificationSetupProps) {
  const { isSupported, permission, requestPermission } = usePushNotifications();

  if (!isSupported) {
    if (compact) return null;
    
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground">
          <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Push notifications are not supported in this browser</p>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'granted') {
    if (compact) {
      return (
        <Button variant="ghost" size="sm" disabled className="gap-2">
          <BellRing className="h-4 w-4 text-green-500" />
          <span className="text-xs text-muted-foreground">Notifications On</span>
        </Button>
      );
    }

    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4 text-center">
          <BellRing className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Push notifications enabled
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You'll be notified of likes, comments, and follows
          </p>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'denied') {
    if (compact) return null;

    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4 text-center">
          <BellOff className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            Notifications blocked
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Enable notifications in your browser settings
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={requestPermission}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        Enable Notifications
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when someone likes, comments, or follows you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={requestPermission} className="w-full">
          <Bell className="h-4 w-4 mr-2" />
          Enable Push Notifications
        </Button>
      </CardContent>
    </Card>
  );
}
