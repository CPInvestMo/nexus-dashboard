import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Investors from "./pages/admin/Investors";
import Properties from "./pages/admin/Properties";
import Payments from "./pages/admin/Payments";
import Cheques from "./pages/admin/Cheques";
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import PropertyDetails from "./pages/investor/PropertyDetails";
import PaymentCenter from "./pages/investor/PaymentCenter";
import DocumentVault from "./pages/investor/DocumentVault";
import AvailableProperties from "./pages/investor/AvailableProperties";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/investor/portfolio"} component={InvestorDashboard} />
      <Route path={"/investor/property/:id"} component={PropertyDetails} />
      <Route path={"/investor/payments"} component={PaymentCenter} />
      <Route path={"/investor/documents"} component={DocumentVault} />
      <Route path={"/investor/available"} component={AvailableProperties} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/investors"} component={Investors} />
      <Route path={"/admin/properties"} component={Properties} />
      <Route path={"/admin/payments"} component={Payments} />
      <Route path={"/admin/cheques"} component={Cheques} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
