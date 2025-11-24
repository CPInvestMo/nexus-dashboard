import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Redirect } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  // Redirect authenticated users to their respective dashboards
  if (!loading && isAuthenticated) {
    if (user?.role === "investor") {
      return <Redirect to="/investor" />;
    } else if (user?.role === "super_admin" || user?.role === "internal_admin") {
      return <Redirect to="/admin" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-24 w-24 mx-auto mb-8" />
            <h1 className="text-5xl font-bold text-foreground mb-4">{APP_TITLE}</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Sophisticated multi-tier dashboard system for property management, financial tracking, and investor relations.
            </p>
            
            {!isAuthenticated ? (
              <div className="space-y-4">
                <a href={getLoginUrl()}>
                  <Button size="lg" className="text-lg px-8 py-6">
                    <Building2 className="h-5 w-5 mr-2" />
                    Login to Investor Portal
                  </Button>
                </a>
                <p className="text-sm text-muted-foreground">
                  Secure access to your real estate portfolio
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Welcome, {user?.name}!
                </p>
                <p className="text-sm text-muted-foreground">
                  Role: {user?.role}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
