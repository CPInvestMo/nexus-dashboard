import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  FileText, 
  CreditCard, 
  LogOut,
  Building2,
  MapPin,
  Download,
  Calendar
} from "lucide-react";
import { Link, useRoute } from "wouter";

export default function PropertyDetails() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, params] = useRoute("/investor/property/:id");
  const propertyId = params?.id ? parseInt(params.id) : 0;

  const { data, isLoading } = trpc.investor.getPropertyDetails.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );

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
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Property Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The property you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/investor/portfolio">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portfolio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { property, payments, documents } = data;

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
      month: "long",
      day: "numeric",
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      "Paid": { label: "Paid", variant: "default" },
      "Pending": { label: "Pending", variant: "secondary" },
      "Overdue": { label: "Overdue", variant: "destructive" },
    };
    
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
        {/* Back Button */}
        <Link href="/investor/portfolio">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Portfolio
          </Button>
        </Link>

        {/* Property Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{property.name}</h2>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {property.location}
          </p>
        </div>

        {/* Property Image */}
        {property.thumbnailUrl && (
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
            <img
              src={property.thumbnailUrl}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tabbed Content */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="contract">Contract Details</TabsTrigger>
            <TabsTrigger value="description">Property Description</TabsTrigger>
          </TabsList>

          {/* Payment History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  A detailed record of all payments made towards this property.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!payments || payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No payment history available yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount Paid</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-border">
                            <td className="py-3 px-4 text-sm text-foreground">
                              {formatDate(payment.collectionDate || payment.dueDate)}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-foreground">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="py-3 px-4">
                              {getPaymentStatusBadge(payment.status)}
                            </td>
                            <td className="py-3 px-4">
                              {payment.receiptUrl ? (
                                <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
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
          </TabsContent>

          {/* Contract Details Tab */}
          <TabsContent value="contract" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
                <CardDescription>
                  Key terms and information from your sales contract.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Purchase Price</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(property.purchasePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(property.currentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Purchase Date</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatDate(property.purchaseDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Property Type</p>
                    <p className="text-lg font-semibold text-foreground">
                      {property.propertyType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Area</p>
                    <p className="text-lg font-semibold text-foreground">
                      {property.area ? `${property.area} m²` : "N/A"}
                    </p>
                  </div>
                </div>

                {documents.filter(d => d.documentType === "Contract").length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Contract Documents</p>
                    <div className="space-y-2">
                      {documents
                        .filter(d => d.documentType === "Contract")
                        .map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{doc.name}</span>
                            </div>
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Description Tab */}
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Description</CardTitle>
                <CardDescription>
                  Full details and specifications of your property.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {property.description ? (
                  <div className="prose prose-sm max-w-none text-foreground">
                    <p>{property.description}</p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No description available for this property.
                  </p>
                )}

                {property.imageUrls && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Property Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {JSON.parse(property.imageUrls).map((url: string, index: number) => (
                        <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`${property.name} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
