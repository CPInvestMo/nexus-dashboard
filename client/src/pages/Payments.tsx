import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard, 
  FileText, 
  LogOut,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Payments() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: payments, isLoading } = trpc.admin.getAllPayments.useQuery();

  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!loading && user && user.role !== "super_admin" && user.role !== "internal_admin") {
    window.location.href = "/investor/portfolio";
    return null;
  }

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/investors", icon: Users, label: "Investors" },
    { path: "/admin/properties", icon: Building2, label: "Properties" },
    { path: "/admin/payments", icon: CreditCard, label: "Payments" },
    { path: "/admin/cheques", icon: FileText, label: "Cheques" },
  ];

  const filteredPayments = payments?.filter((payment: any) => {
    const matchesSearch = 
      payment.investorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.propertyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive", icon: any }> = {
      "Paid": { variant: "default", icon: CheckCircle },
      "Pending": { variant: "secondary", icon: Clock },
      "Overdue": { variant: "destructive", icon: AlertCircle }
    };
    
    const { variant, icon: Icon } = config[status] || { variant: "default", icon: Clock };
    
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default">
              {user?.role === "super_admin" ? "Super Admin" : "Internal Admin"}
            </Badge>
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

      <div className="container mx-auto px-4 py-8">
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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Payment Tracking</h2>
            <p className="text-muted-foreground">
              Monitor all payments, installments, and overdue amounts
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by investor or property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
            <CardDescription>
              {filteredPayments?.length || 0} payment(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading payments...</p>
              </div>
            ) : !filteredPayments || filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" ? "No payments match your filters" : "No payments yet"}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Payment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Investor</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Penalty</TableHead>
                    <TableHead>Total Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: any) => {
                    const penalty = payment.penaltyAmount || 0;
                    const totalDue = payment.amount + penalty;
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatDate(payment.dueDate)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{payment.investorName || "Unknown"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{payment.propertyName || "Unknown"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">EGP {payment.amount.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {penalty > 0 ? (
                            <span className="text-red-500 font-medium">
                              +EGP {penalty.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">EGP {totalDue.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell>
                          {payment.paidDate ? (
                            <span className="text-sm">{formatDate(payment.paidDate)}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not paid</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
