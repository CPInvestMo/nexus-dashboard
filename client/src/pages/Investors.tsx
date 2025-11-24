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
  Eye,
  Edit,
  Mail,
  Phone
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Investors() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: investors, isLoading } = trpc.admin.getAllInvestors.useQuery();

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

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/investors", icon: Users, label: "Investors" },
    { path: "/admin/properties", icon: Building2, label: "Properties" },
    { path: "/admin/payments", icon: CreditCard, label: "Payments" },
    { path: "/admin/cheques", icon: FileText, label: "Cheques" },
  ];

  // Filter investors based on search
  const filteredInvestors = investors?.filter((inv: any) =>
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.investorNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Investor Management</h2>
            <p className="text-muted-foreground">
              Manage investor relationships and track their portfolios
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Investor
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or investor number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investors Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Investors</CardTitle>
            <CardDescription>
              {filteredInvestors?.length || 0} investor(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading investors...</p>
              </div>
            ) : !filteredInvestors || filteredInvestors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "No investors match your search" : "No investors yet"}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Investor
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Total Investment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvestors.map((investor: any) => (
                    <TableRow key={investor.id}>
                      <TableCell className="font-mono text-sm">
                        {investor.investorNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{investor.name}</p>
                          <p className="text-sm text-muted-foreground">{investor.nationalId || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{investor.email}</span>
                          </div>
                          {investor.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{investor.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {investor.propertyCount || 0} properties
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {investor.totalInvestment
                            ? `EGP ${investor.totalInvestment.toLocaleString()}`
                            : "EGP 0"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={investor.hasOverduePayments ? "destructive" : "default"}>
                          {investor.hasOverduePayments ? "Overdue" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
