import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Linkedin, Twitter, Globe, Mail, Code2 } from "lucide-react";

interface DeveloperInfo {
  name: string;
  role: string;
  bio: string;
  skills: string[];
  profileImage?: string;
  social: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
  };
}

// Parse content field to extract structured data
const parseContent = (content: string): Partial<DeveloperInfo> => {
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    // Return as bio if not JSON
    return { bio: content };
  }
};

export default function AboutDeveloper() {
  const queryClient = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ["aboutDeveloperPage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("static_pages")
        .select("*")
        .eq("slug", "about-developer")
        .eq("is_published", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription for static pages
  useEffect(() => {
    const channel = supabase
      .channel('about_developer_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'static_pages' },
        (payload) => {
          // Only invalidate if it's the about-developer page
          if ((payload.new as any)?.slug === 'about-developer' || (payload.old as any)?.slug === 'about-developer') {
            queryClient.invalidateQueries({ queryKey: ["aboutDeveloperPage"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          <Skeleton className="h-64 w-full mb-4 rounded-xl" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Default developer info
  const defaultInfo: DeveloperInfo = {
    name: "Dynamic Edu Development Team",
    role: "Full Stack Developers",
    bio: `We are a passionate team of developers dedicated to creating impactful digital solutions for education.

Our mission is to empower students and educators with innovative technology that makes learning more engaging and accessible.

This platform was built with modern technologies including React, TypeScript, Tailwind CSS, and Supabase, ensuring a fast, secure, and scalable experience for all users.`,
    skills: ["React", "TypeScript", "Node.js", "Supabase", "Tailwind CSS", "UI/UX Design"],
    social: {
      github: "#",
      linkedin: "#",
      twitter: "#",
      website: "#",
      email: "contact@dynamicedu.com",
    }
  };

  // Merge page content with defaults
  const parsedContent = page?.content ? parseContent(page.content) : {};
  const info: DeveloperInfo = {
    ...defaultInfo,
    ...parsedContent,
    social: {
      ...defaultInfo.social,
      ...parsedContent.social,
    },
    skills: parsedContent.skills || defaultInfo.skills,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20">
            <div className="absolute inset-0 flex items-center justify-center">
              {info.profileImage ? (
                <img 
                  src={info.profileImage} 
                  alt={info.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary/20 object-cover"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center">
                  <Code2 className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              )}
            </div>
          </div>
          
          <CardContent className="text-center pt-6 pb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{info.name}</h1>
            <p className="text-muted-foreground mb-4">{info.role}</p>
            
            {/* Social Links */}
            <div className="flex justify-center gap-3 mb-6">
              {info.social.github && info.social.github !== "#" && (
                <Button variant="outline" size="icon" asChild>
                  <a href={info.social.github} target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {info.social.linkedin && info.social.linkedin !== "#" && (
                <Button variant="outline" size="icon" asChild>
                  <a href={info.social.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {info.social.twitter && info.social.twitter !== "#" && (
                <Button variant="outline" size="icon" asChild>
                  <a href={info.social.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {info.social.website && info.social.website !== "#" && (
                <Button variant="outline" size="icon" asChild>
                  <a href={info.social.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {info.social.email && (
                <Button variant="outline" size="icon" asChild>
                  <a href={`mailto:${info.social.email}`}>
                    <Mail className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">About</h2>
            <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">
                {info.bio}
              </div>
            </article>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">Technologies Used</h2>
            <div className="flex flex-wrap gap-2">
              {info.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardContent className="p-6 md:p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-4">
              Have questions or want to collaborate? We'd love to hear from you!
            </p>
            <Button asChild>
              <a href={`mailto:${info.social.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Contact Us
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
