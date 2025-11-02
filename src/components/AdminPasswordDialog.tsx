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
} from "@/components/ui/dialog";
import { AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminPasswordDialogProps {
  open: boolean;
  onSuccess: () => void;
}

const ADMIN_PASSWORD = "000000";

export function AdminPasswordDialog({ open, onSuccess }: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onSuccess();
        setPassword("");
      } else {
        setError(true);
        setPassword("");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-6 w-6 text-primary" />
            <DialogTitle>Admin Access Required</DialogTitle>
          </div>
          <DialogDescription>
            Enter the admin password to access the admin panel.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Security Warning:</strong> This authentication method is not secure for production use.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter admin password"
                autoFocus
                className={error ? "border-destructive" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">
                Incorrect password. Please try again.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !password} className="w-full">
              {loading ? "Verifying..." : "Access Admin Panel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
