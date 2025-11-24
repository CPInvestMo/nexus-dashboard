import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Home, 
  LogOut,
  Building2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Redirect } from "wouter";

export default function InvestorDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Check if user is an investor
  if (!loading && user && user.role !== "investor") {
    return <Redirect to="/" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/investor/portfolio", icon: LayoutDashboard, label: "My Portfolio" },
    { path: "/investor/payments", icon: CreditCard, label: "Payment Center" },
    { path: "/investor/documents", icon: FileText, label: "Document Vault" },
    { path: "/investor/available", icon: Building2, label: "Available Properties" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">Investor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <nav className="flex gap-2 mb-8 border-b border-border">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Welcome Message */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "Investor"}!
          </h2>
          <p className="text-muted-foreground">
            Manage your real estate portfolio, track payments, and explore new investment opportunities.
          </p>
        </div>

        {/* Quick Stats */}
        <InvestorStats />

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to explore your portfolio?
          </p>
          <Link href="/investor/portfolio">
            <Button size="lg">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              View My Portfolio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InvestorStats() {
  const { data: properties, isLoading: propertiesLoading } = trpc.investor.getMyProperties.useQuery();
  const { data: payments, isLoading: paymentsLoading } = trpc.investor.getMyPayments.useQuery();

  if (propertiesLoading || paymentsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalProperties = properties?.length || 0;
  const totalInvestment = properties?.reduce((sum, p) => sum + (p.purchasePrice || 0), 0) || 0;
  const overduePayments = payments?.filter(p => p.status === "Overdue").length || 0;

  const stats = [
    {
      label: "Total Properties",
      value: totalProperties,
      icon: Home,
      color: "text-blue-500",
    },
    {
      label: "Total Investment",
      value: `${(totalInvestment / 1000000).toFixed(2)}M EGP`,
      icon: CreditCard,
      color: "text-green-500",
    },
    {
      label: "Overdue Payments",
      value: overduePayments,
      icon: FileText,
      color: overduePayments > 0 ? "text-red-500" : "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
