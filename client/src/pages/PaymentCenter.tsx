import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  LogOut,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpDown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type PaymentStatus = "All" | "Pending" | "Paid" | "Overdue";
type SortOption = "dueDate" | "amount" | "status";

export default function PaymentCenter() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: payments, isLoading, refetch } = trpc.investor.getMyPayments.useQuery();
  
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>("All");
  const [sortBy, setSortBy] = useState<SortOption>("dueDate");

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payments...</p>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: any }> = {
      "Paid": { label: "Paid", variant: "default", icon: CheckCircle },
      "Pending": { label: "Pending", variant: "secondary", icon: Clock },
      "Overdue": { label: "Overdue", variant: "destructive", icon: AlertCircle },
    };
    
    const config = statusConfig[status] || { label: status, variant: "secondary", icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const createCheckout = trpc.stripe.createCheckoutSession.useMutation();

  const handlePayNow = async (paymentId: number, amount: number) => {
    try {
      toast.info("Redirecting to payment gateway...");
      const result = await createCheckout.mutateAsync({ paymentId });
      if (result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create payment session. Please ensure Stripe is configured.");
    }
  };

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    if (!payments) return [];
    
    let filtered = payments;
    
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "amount":
          return b.totalDue - a.totalDue;
        case "status":
          const statusOrder = { "Overdue": 0, "Pending": 1, "Paid": 2 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 3) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 3);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [payments, statusFilter, sortBy]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!payments) return { total: 0, overdue: 0, pending: 0, overdueAmount: 0, pendingAmount: 0 };
    
    return payments.reduce((acc, payment) => {
      acc.total++;
      if (payment.status === "Overdue") {
        acc.overdue++;
        acc.overdueAmount += payment.totalDue;
      } else if (payment.status === "Pending") {
        acc.pending++;
        acc.pendingAmount += payment.totalDue;
      }
      return acc;
    }, { total: 0, overdue: 0, pending: 0, overdueAmount: 0, pendingAmount: 0 });
  }, [payments]);

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
          <h2 className="text-3xl font-bold text-foreground mb-2">Payment Center</h2>
          <p className="text-muted-foreground">
            Track your payment schedule and manage upcoming and overdue payments.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{summary.total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Overdue Amount</p>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-500">{formatCurrency(summary.overdueAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.overdue} payment(s)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(summary.pendingAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.pending} payment(s)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Filter by Status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Payments</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Sort by</label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date (Nearest First)</SelectItem>
                <SelectItem value="amount">Amount (Highest First)</SelectItem>
                <SelectItem value="status">Status (Urgent First)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
            <CardDescription>
              {filteredAndSortedPayments.length} payment(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAndSortedPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Payments Found</h3>
                <p className="text-muted-foreground">
                  {statusFilter !== "All" 
                    ? `No ${statusFilter.toLowerCase()} payments to display.` 
                    : "You don't have any payment records yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Due Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount Due</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Property</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedPayments.map((payment) => (
                      <tr 
                        key={payment.id} 
                        className={`border-b border-border ${payment.status === "Overdue" ? "bg-red-500/5" : ""}`}
                      >
                        <td className="py-3 px-4 text-sm text-foreground">
                          {formatDate(payment.dueDate)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground">
                          {formatCurrency(payment.totalDue)}
                          {payment.penaltyAmount > 0 && (
                            <span className="text-xs text-red-500 block">
                              +{formatCurrency(payment.penaltyAmount)} penalty
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {payment.propertyName}
                        </td>
                        <td className="py-3 px-4">
                          {payment.status === "Paid" ? (
                            <span className="text-sm text-muted-foreground">Completed</span>
                          ) : (
                            <Button 
                              size="sm" 
                              variant={payment.status === "Overdue" ? "destructive" : "default"}
                              onClick={() => handlePayNow(payment.id, payment.totalDue)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
