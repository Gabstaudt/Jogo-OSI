import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Competition from "./pages/Competition";
import NOC from "./pages/NOC";
import Cooper from "./pages/Cooper";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Portal from "./pages/Portal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/individual" element={<Index />} />
          <Route path="/competition" element={<Competition />} />
          <Route path="/noc" element={<NOC />} />
          <Route path="/NOC" element={<NOC />} />
          <Route path="/cooper" element={<Cooper />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
