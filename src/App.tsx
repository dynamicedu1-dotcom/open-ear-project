import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Share from "./pages/Share";
import Wall from "./pages/Wall";
import Actions from "./pages/Actions";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import Collaborate from "./pages/Collaborate";
import Insights from "./pages/Insights";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Team from "./pages/Team";
import MyActivity from "./pages/MyActivity";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import TeamPanel from "./pages/TeamPanel";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Donate from "./pages/Donate";
import Terms from "./pages/Terms";
import AboutDeveloper from "./pages/AboutDeveloper";
import StaticPage from "./pages/StaticPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/share" element={<Share />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/actions" element={<Actions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/collaborate" element={<Collaborate />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/team" element={<Team />} />
          <Route path="/my-activity" element={<MyActivity />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/team-panel" element={<TeamPanel />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about-developer" element={<AboutDeveloper />} />
          <Route path="/page/:slug" element={<StaticPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
