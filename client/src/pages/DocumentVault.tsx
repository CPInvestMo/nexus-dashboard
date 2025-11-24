import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Download,
  Search,
  File,
  FileCheck
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";

type DocumentType = "All" | "Contract" | "Receipt" | "Invoice" | "Other";

export default function DocumentVault() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: documents, isLoading } = trpc.investor.getMyDocuments.useQuery();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType>("All");

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
          <p className="text-muted-foreground">Loading documents...</p>
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

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "Contract":
        return FileCheck;
      case "Receipt":
      case "Invoice":
        return FileText;
      default:
        return File;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeConfig: Record<string, { variant: "default" | "secondary" | "outline" }> = {
      "Contract": { variant: "default" },
      "Receipt": { variant: "secondary" },
      "Invoice": { variant: "secondary" },
      "Other": { variant: "outline" },
    };
    
    const config = typeConfig[type] || { variant: "outline" };
    return <Badge variant={config.variant}>{type}</Badge>;
  };

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    
    let filtered = documents;
    
    // Apply type filter
    if (typeFilter !== "All") {
      filtered = filtered.filter(d => d.documentType === typeFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.propertyName?.toLowerCase().includes(query) ||
        d.documentType.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [documents, typeFilter, searchQuery]);

  // Group documents by type
  const documentsByType = useMemo(() => {
    if (!documents) return {};
    
    return documents.reduce((acc, doc) => {
      const type = doc.documentType || "Other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    }, {} as Record<string, typeof documents>);
  }, [documents]);

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
          <h2 className="text-3xl font-bold text-foreground mb-2">Document Vault</h2>
          <p className="text-muted-foreground">
            Securely access your contracts, receipts, and other important documents.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(documentsByType).map(([type, docs]) => {
            const Icon = getDocumentIcon(type);
            return (
              <Card key={type}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{type}s</p>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{docs.length}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documents by name or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-48">
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Contract">Contracts</SelectItem>
                <SelectItem value="Receipt">Receipts</SelectItem>
                <SelectItem value="Invoice">Invoices</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              {filteredDocuments.length} document(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Documents Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || typeFilter !== "All" 
                    ? "Try adjusting your search or filter criteria." 
                    : "You don't have any documents yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => {
                  const Icon = getDocumentIcon(doc.documentType);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground mb-1">{doc.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {getDocumentTypeBadge(doc.documentType)}
                            {doc.propertyName && (
                              <>
                                <span>•</span>
                                <Link href={`/investor/property/${doc.propertyId}`}>
                                  <a className="hover:text-primary transition-colors">
                                    {doc.propertyName}
                                  </a>
                                </Link>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatDate(doc.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
