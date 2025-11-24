import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  LogOut,
  Building2,
  MapPin,
  ArrowRight
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function MyPortfolio() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: properties, isLoading: propertiesLoading } = trpc.investor.getMyProperties.useQuery();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (loading || propertiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your portfolio...</p>
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "Contracted": { label: "On Payment Plan", variant: "default" },
      "Available": { label: "Available", variant: "secondary" },
      "Reserved": { label: "Reserved", variant: "outline" },
    };
    
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">My Portfolio</h2>
          <p className="text-muted-foreground">
            A summary of your real estate assets with Crystal Power Investments.
          </p>
        </div>

        {/* Properties Grid */}
        {!properties || properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Properties Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't purchased any properties yet. Explore available properties to get started.
              </p>
              <Link href="/investor/available">
                <Button>
                  <Building2 className="h-4 w-4 mr-2" />
                  Browse Available Properties
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              // Calculate remaining balance (simplified - in reality would sum payments)
              const remainingBalance = property.currentValue - (property.purchasePrice || 0);
              const isPaidOff = remainingBalance <= 0;

              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Property Image */}
                  <div className="aspect-video bg-muted relative">
                    {property.thumbnailUrl ? (
                      <img
                        src={property.thumbnailUrl}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.location}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Purchase Price:</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(property.purchasePrice)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(property.status)}
                      </div>

                      {!isPaidOff && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Remaining Balance:</span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(Math.abs(remainingBalance))}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link href={`/investor/property/${property.id}`}>
                      <Button className="w-full" variant="outline">
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
