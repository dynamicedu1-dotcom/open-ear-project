import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MessageSquare, BookOpen, User, FileText, Search } from "lucide-react";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Search voices
  const { data: voices } = useQuery({
    queryKey: ["searchVoices", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await supabase
        .from("voices")
        .select("id, content, category")
        .ilike("content", `%${query}%`)
        .limit(5);
      return data || [];
    },
    enabled: query.length >= 2,
  });

  // Search blogs
  const { data: blogs } = useQuery({
    queryKey: ["searchBlogs", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await supabase
        .from("weekly_blogs")
        .select("id, title, summary")
        .eq("is_published", true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(5);
      return data || [];
    },
    enabled: query.length >= 2,
  });

  // Search users
  const { data: users } = useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await supabase
        .from("user_profiles")
        .select("id, display_name, unique_id")
        .or(`display_name.ilike.%${query}%,unique_id.ilike.%${query}%`)
        .eq("is_anonymous", false)
        .limit(5);
      return data || [];
    },
    enabled: query.length >= 2,
  });

  // Search static pages
  const { data: pages } = useQuery({
    queryKey: ["searchPages", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await supabase
        .from("static_pages")
        .select("id, title, slug")
        .eq("is_published", true)
        .ilike("title", `%${query}%`)
        .limit(3);
      return data || [];
    },
    enabled: query.length >= 2,
  });

  const handleSelect = useCallback((type: string, id: string) => {
    onOpenChange(false);
    setQuery("");
    
    switch (type) {
      case "voice":
        navigate(`/wall?voice=${id}`);
        break;
      case "blog":
        navigate(`/blog/${id}`);
        break;
      case "user":
        navigate(`/profile/${id}`);
        break;
      case "page":
        navigate(`/page/${id}`);
        break;
    }
  }, [navigate, onOpenChange]);

  const hasResults = (voices?.length || 0) + (blogs?.length || 0) + (users?.length || 0) + (pages?.length || 0) > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search voices, blogs, users..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length < 2 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Type at least 2 characters to search</p>
            <p className="text-xs mt-1">Press ⌘K to open search anytime</p>
          </div>
        ) : !hasResults ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <>
            {voices && voices.length > 0 && (
              <CommandGroup heading="Voices">
                {voices.map((voice) => (
                  <CommandItem
                    key={voice.id}
                    value={`voice-${voice.id}`}
                    onSelect={() => handleSelect("voice", voice.id)}
                    className="cursor-pointer"
                  >
                    <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm">{voice.content}</p>
                      <p className="text-xs text-muted-foreground">{voice.category}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {blogs && blogs.length > 0 && (
              <CommandGroup heading="Blog Posts">
                {blogs.map((blog) => (
                  <CommandItem
                    key={blog.id}
                    value={`blog-${blog.id}`}
                    onSelect={() => handleSelect("blog", blog.id)}
                    className="cursor-pointer"
                  >
                    <BookOpen className="mr-2 h-4 w-4 text-accent" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{blog.title}</p>
                      {blog.summary && (
                        <p className="text-xs text-muted-foreground truncate">{blog.summary}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {users && users.length > 0 && (
              <CommandGroup heading="Users">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`user-${user.id}`}
                    onSelect={() => handleSelect("user", user.id)}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm">{user.display_name || user.unique_id}</p>
                      {user.unique_id && user.display_name && (
                        <p className="text-xs text-muted-foreground">{user.unique_id}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {pages && pages.length > 0 && (
              <CommandGroup heading="Pages">
                {pages.map((page) => (
                  <CommandItem
                    key={page.id}
                    value={`page-${page.slug}`}
                    onSelect={() => handleSelect("page", page.slug)}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4 text-amber-500" />
                    <span className="truncate">{page.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
