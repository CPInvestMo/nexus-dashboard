import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  LogOut,
  Building2,
  MapPin,
  CheckCircle,
  Clock
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function AvailableProperties() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: properties, isLoading, refetch } = trpc.investor.getAvailableProperties.useQuery();
  const submitReservation = trpc.investor.submitReservation.useMutation();
  
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [reservationMessage, setReservationMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          <p className="text-muted-foreground">Loading available properties...</p>
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary"; icon: any }> = {
      "Available": { label: "Available", variant: "default", icon: CheckCircle },
      "Reserved": { label: "Reserved", variant: "secondary", icon: Clock },
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

  const handleReserveClick = (propertyId: number) => {
    setSelectedProperty(propertyId);
    setReservationMessage("");
    setIsDialogOpen(true);
  };

  const handleSubmitReservation = async () => {
    if (!selectedProperty) return;

    try {
      await submitReservation.mutateAsync({
        propertyId: selectedProperty,
        message: reservationMessage || undefined,
      });

      toast.success("Reservation Submitted!", {
        description: "Your reservation has been submitted. An admin will contact you shortly.",
      });

      setIsDialogOpen(false);
      setSelectedProperty(null);
      setReservationMessage("");
      refetch();
    } catch (error: any) {
      toast.error("Reservation Failed", {
        description: error.message || "Failed to submit reservation. Please try again.",
      });
    }
  };

  const selectedPropertyData = properties?.find(p => p.id === selectedProperty);

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
          <h2 className="text-3xl font-bold text-foreground mb-2">Available Properties</h2>
          <p className="text-muted-foreground">
            Explore new investment opportunities and reserve properties that interest you.
          </p>
        </div>

        {/* Properties Grid */}
        {!properties || properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Properties Available</h3>
              <p className="text-muted-foreground">
                There are currently no properties available for sale. Check back later for new opportunities.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
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
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(property.status)}
                  </div>
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
                      <span className="text-muted-foreground">Asking Price:</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(property.currentValue)}
                      </span>
                    </div>
                    
                    {property.propertyType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium text-foreground">
                          {property.propertyType}
                        </span>
                      </div>
                    )}

                    {property.area && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Area:</span>
                        <span className="font-medium text-foreground">
                          {property.area} m²
                        </span>
                      </div>
                    )}
                  </div>

                  {property.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  <Button 
                    className="w-full" 
                    disabled={property.status !== "Available"}
                    onClick={() => handleReserveClick(property.id)}
                  >
                    {property.status === "Available" ? "Reserve Now" : "Already Reserved"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reserve Property</DialogTitle>
            <DialogDescription>
              Submit your reservation request for {selectedPropertyData?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <div className="text-sm font-medium text-foreground bg-muted px-3 py-2 rounded-md">
                {user?.name}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="text-sm font-medium text-foreground bg-muted px-3 py-2 rounded-md">
                {user?.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Property</Label>
              <div className="text-sm font-medium text-foreground bg-muted px-3 py-2 rounded-md">
                {selectedPropertyData?.name} - {selectedPropertyData?.location}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add any questions or special requests..."
                value={reservationMessage}
                onChange={(e) => setReservationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReservation}
              disabled={submitReservation.isPending}
            >
              {submitReservation.isPending ? "Submitting..." : "Submit Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
