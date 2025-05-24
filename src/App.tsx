import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import NotFound from "./pages/NotFound";
import DemoPage from "./pages/Demo";
import PlayPage from "./pages/Play";
import SoundSettingsPage from "./pages/SoundSettings";
import Connect from "./pages/Connect";
import Game from "./pages/Game";
import LiveGamesPage from "./pages/Live";
import ConfirmationPage from "./pages/Confirmation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/sounds" element={<SoundSettingsPage />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/game/:gameId" element={<Game />} />
          <Route path="/live" element={<LiveGamesPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
