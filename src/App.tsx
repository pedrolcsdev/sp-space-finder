import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./screens/Index";
import SearchPage from "./screens/SearchPage";
import ChatResults from "./screens/ChatResults";
import Login from "./screens/Login";
import Onboarding from "./screens/Onboarding";
import NotFound from "./screens/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { spaces } from "./data/mockData";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index spaces={spaces} />} />
          <Route
            path="/encontrar"
            element={<SearchPage spaces={spaces} initialCategory={undefined} />}
          />
          <Route path="/chat-resultados" element={<ChatResults spaces={spaces} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

