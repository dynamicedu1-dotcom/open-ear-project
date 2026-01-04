import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Shield, Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Terms() {
  const { data: pages, isLoading } = useQuery({
    queryKey: ["termsPages"],
    queryFn: async () => {
      const slugs = ["terms-of-service", "privacy-policy", "community-guidelines"];
      const { data, error } = await supabase
        .from("static_pages")
        .select("*")
        .in("slug", slugs)
        .eq("is_published", true);
      
      if (error) throw error;
      return data;
    },
  });

  const termsPage = pages?.find(p => p.slug === "terms-of-service");
  const privacyPage = pages?.find(p => p.slug === "privacy-policy");
  const guidelinesPage = pages?.find(p => p.slug === "community-guidelines");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Default content if pages don't exist
  const defaultTerms = `
Terms of Service

Last updated: ${new Date().toLocaleDateString()}

1. Acceptance of Terms
By accessing and using this platform, you accept and agree to be bound by these Terms of Service.

2. User Accounts
You are responsible for maintaining the confidentiality of your account and password.

3. User Content
You retain ownership of content you submit. By posting, you grant us a license to use, display, and distribute your content.

4. Prohibited Activities
Users may not post illegal, harmful, or offensive content. Spam, harassment, and impersonation are strictly prohibited.

5. Disclaimer
The platform is provided "as is" without warranties of any kind.

6. Changes to Terms
We reserve the right to modify these terms at any time. Continued use constitutes acceptance of changes.
  `.trim();

  const defaultPrivacy = `
Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

1. Information We Collect
We collect information you provide directly, such as name, email, and content you post.

2. How We Use Information
We use your information to provide and improve our services, communicate with you, and ensure platform safety.

3. Information Sharing
We do not sell your personal information. We may share data with service providers who assist in platform operations.

4. Data Security
We implement reasonable security measures to protect your information.

5. Your Rights
You may request access to, correction of, or deletion of your personal data.

6. Contact Us
For privacy-related questions, please contact us through our Contact page.
  `.trim();

  const defaultGuidelines = `
Community Guidelines

Our community thrives when everyone feels safe and respected. Please follow these guidelines:

1. Be Respectful
Treat others with kindness and respect. Disagree constructively without personal attacks.

2. Keep It Appropriate
No explicit content, hate speech, or discrimination based on race, gender, religion, or other characteristics.

3. Be Authentic
Use your real voice. Don't impersonate others or spread misinformation.

4. Protect Privacy
Don't share others' personal information without consent.

5. No Spam
Don't post repetitive content or promotional material.

6. Report Issues
If you see content that violates these guidelines, please report it.

Violations may result in content removal or account suspension.
  `.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms & Policies</h1>
          <p className="text-muted-foreground">
            Read our terms, privacy policy, and community guidelines
          </p>
        </div>

        <Tabs defaultValue="terms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Terms</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Guidelines</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <Card>
              <CardContent className="p-6 md:p-8">
                <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">
                    {termsPage?.content || defaultTerms}
                  </div>
                </article>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardContent className="p-6 md:p-8">
                <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">
                    {privacyPage?.content || defaultPrivacy}
                  </div>
                </article>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidelines">
            <Card>
              <CardContent className="p-6 md:p-8">
                <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">
                    {guidelinesPage?.content || defaultGuidelines}
                  </div>
                </article>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
