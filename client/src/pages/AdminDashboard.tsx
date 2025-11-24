import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard, 
  FileText, 
  LogOut,
  AlertCircle,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();
  const { data: pendingReservations } = trpc.admin.getPendingReservations.useQuery();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Redirect if not admin
  if (!loading && user && user.role !== "super_admin" && user.role !== "internal_admin") {
    window.location.href = "/investor/portfolio";
    return null;
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },