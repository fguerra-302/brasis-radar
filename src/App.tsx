import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Config from "./pages/Config";
import Curadoria from "./pages/Curadoria";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthPage } from "@/components/auth/AuthPage";

const queryClient = new QueryClient();

const App = () => {
  console.log('🚀 App inicializando - Preview deve aparecer agora');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
              <Route path="/config/*" element={<AuthGuard><Config /></AuthGuard>} />
              <Route path="/curadoria/*" element={<AuthGuard><Curadoria /></AuthGuard>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
