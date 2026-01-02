import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useIdentity } from "@/hooks/useIdentity";
import { format } from "date-fns";

interface RegistrationField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface EventRegistrationFormProps {
  blogId: string;
  blogTitle: string;
  eventDate?: string | null;
  eventEndDate?: string | null;
  eventLocation?: string | null;
  eventSlots?: number | null;
  registrationFields: RegistrationField[];
  isPaid: boolean;
  price?: number | null;
  registrationDeadline?: string | null;
  requiresApproval: boolean;
  maxRegistrations?: number | null;
}

export function EventRegistrationForm({
  blogId,
  blogTitle,
  eventDate,
  eventEndDate,
  eventLocation,
  eventSlots,
  registrationFields,
  isPaid,
  price,
  registrationDeadline,
  requiresApproval,
  maxRegistrations,
}: EventRegistrationFormProps) {
  const { userProfile, getUserId } = useIdentity();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState<number | null>(null);

  // Check if already registered
  React.useEffect(() => {
    const checkRegistration = async () => {
      const userId = getUserId();
      if (userId) {
        const { data } = await supabase
          .from("blog_registrations")
          .select("id")
          .eq("blog_id", blogId)
          .eq("user_profile_id", userId)
          .maybeSingle();
        
        if (data) {
          setIsRegistered(true);
        }
      }

      // Get registration count
      const { count } = await supabase
        .from("blog_registrations")
        .select("*", { count: "exact", head: true })
        .eq("blog_id", blogId)
        .in("status", ["pending", "approved"]);
      
      setRegistrationCount(count);
    };

    checkRegistration();
  }, [blogId, getUserId]);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      for (const field of registrationFields) {
        if (field.required && !formData[field.name]) {
          toast.error(`${field.label} is required`);
          setIsSubmitting(false);
          return;
        }
      }

      // Check slots availability
      if (eventSlots && eventSlots > 0 && registrationCount !== null && registrationCount >= eventSlots) {
        toast.error("Sorry, all slots are filled");
        setIsSubmitting(false);
        return;
      }

      // Check deadline
      if (registrationDeadline && new Date(registrationDeadline) < new Date()) {
        toast.error("Registration deadline has passed");
        setIsSubmitting(false);
        return;
      }

      const userId = getUserId();
      
      const { error } = await supabase.from("blog_registrations").insert({
        blog_id: blogId,
        user_profile_id: userId || null,
        registration_data: formData,
        status: requiresApproval ? "pending" : "approved",
        payment_status: isPaid ? "unpaid" : "not_applicable",
        contact_email: formData.email || null,
        contact_name: formData.name || null,
        contact_phone: formData.phone || null,
      });

      if (error) throw error;

      setIsRegistered(true);
      toast.success(
        requiresApproval
          ? "Registration submitted! Awaiting admin approval."
          : "Registration successful!"
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeadlinePassed = registrationDeadline && new Date(registrationDeadline) < new Date();
  const isFull = eventSlots && eventSlots > 0 && registrationCount !== null && registrationCount >= eventSlots;

  if (isRegistered) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="h-8 w-8" />
            <div>
              <h3 className="font-semibold text-lg">You're Registered!</h3>
              <p className="text-sm text-muted-foreground">
                {requiresApproval
                  ? "Your registration is pending admin approval."
                  : "We'll see you at the event!"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Register Now
        </CardTitle>
        <CardDescription>
          Fill out the form below to register for this event
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Event Info Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          {eventDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{format(new Date(eventDate), "PPP 'at' p")}</span>
            </div>
          )}
          {eventEndDate && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Until {format(new Date(eventEndDate), "PPP 'at' p")}</span>
            </div>
          )}
          {eventLocation && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{eventLocation}</span>
            </div>
          )}
          {eventSlots && eventSlots > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>{registrationCount ?? 0} / {eventSlots} registered</span>
            </div>
          )}
          {isPaid && price && (
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              <span>₹{price.toFixed(2)}</span>
            </div>
          )}
          {registrationDeadline && (
            <div className={`flex items-center gap-2 text-sm ${isDeadlinePassed ? "text-destructive" : ""}`}>
              <Clock className="h-4 w-4" />
              <span>Deadline: {format(new Date(registrationDeadline), "PPP")}</span>
            </div>
          )}
        </div>

        {isDeadlinePassed ? (
          <div className="text-center py-6 text-destructive">
            <p className="font-semibold">Registration Closed</p>
            <p className="text-sm">The deadline for this event has passed.</p>
          </div>
        ) : isFull ? (
          <div className="text-center py-6 text-orange-600">
            <p className="font-semibold">Event Full</p>
            <p className="text-sm">All available slots have been filled.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {registrationFields.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    required={field.required}
                    className="mt-1"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    required={field.required}
                    className="mt-1"
                  />
                )}
              </div>
            ))}

            {requiresApproval && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                Note: Your registration will require admin approval before confirmation.
              </p>
            )}

            {isPaid && price && (
              <p className="text-sm text-primary bg-primary/10 p-3 rounded">
                Payment of ₹{price.toFixed(2)} will be required to complete your registration.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Register"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}