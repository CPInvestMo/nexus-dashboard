import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export function AddInvestorDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    nationalId: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const createInvestor = trpc.admin.createInvestor.useMutation({
    onSuccess: () => {
      toast.success("Investor added successfully!");
      utils.admin.getAllInvestors.invalidate();
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        nationalId: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add investor");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Generate investor number (INV-YYYYMMDD-XXX format)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const investorNumber = `INV-${dateStr}-${randomNum}`;

    createInvestor.mutate({
      ...formData,
      userId: 0, // Will be linked later when investor creates account
      investorNumber,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Investor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Investor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ahmed Hassan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ahmed@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 1234567890"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="29501011234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Cairo, Egypt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about the investor..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvestor.isPending}>
              {createInvestor.isPending ? "Adding..." : "Add Investor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
