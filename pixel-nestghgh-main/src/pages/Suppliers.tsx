import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Users,
  Plus,
  DollarSign,
  Phone,
  Mail,
  Download,
  Search,
  Filter,
  Edit,
  Eye,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock supplier data
const mockSuppliers = [
  {
    id: "SUP001",
    name: "TechParts Solutions",
    contactPerson: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh@techparts.com",
    address: "123 Electronics Market, Hyderabad",
    outstandingAmount: 25000,
    totalPurchases: 245000,
    lastOrderDate: "2024-01-15",
    status: "active",
    paymentTerms: "30 days",
    category: "Electronics",
  },
  {
    id: "SUP002",
    name: "Mobile Components Ltd",
    contactPerson: "Priya Sharma",
    phone: "+91 87654 32109",
    email: "priya@mobilecomponents.in",
    address: "456 Tech Plaza, Mumbai",
    outstandingAmount: 0,
    totalPurchases: 180000,
    lastOrderDate: "2024-01-12",
    status: "active",
    paymentTerms: "15 days",
    category: "Parts",
  },
  {
    id: "SUP003",
    name: "Screen Masters",
    contactPerson: "Amit Patel",
    phone: "+91 76543 21098",
    email: "amit@screenmasters.com",
    address: "789 Display Street, Delhi",
    outstandingAmount: 12500,
    totalPurchases: 95000,
    lastOrderDate: "2024-01-10",
    status: "active",
    paymentTerms: "45 days",
    category: "Displays",
  },
  {
    id: "SUP004",
    name: "Battery Pro Solutions",
    contactPerson: "Sneha Reddy",
    phone: "+91 65432 10987",
    email: "sneha@batterypro.in",
    address: "321 Power Lane, Bangalore",
    outstandingAmount: 8750,
    totalPurchases: 67500,
    lastOrderDate: "2024-01-08",
    status: "inactive",
    paymentTerms: "30 days",
    category: "Batteries",
  },
];

export default function Suppliers() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [suppliers, setSuppliers] = useState(mockSuppliers);

  // Filter suppliers based on search and status
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || supplier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const totalOutstanding = suppliers.reduce(
    (sum, s) => sum + s.outstandingAmount,
    0,
  );
  const totalPurchases = suppliers.reduce(
    (sum, s) => sum + s.totalPurchases,
    0,
  );

  const handleAddSupplier = (formData: any) => {
    const newSupplier = {
      id: `SUP${String(suppliers.length + 1).padStart(3, "0")}`,
      ...formData,
      outstandingAmount: 0,
      totalPurchases: 0,
      lastOrderDate: new Date().toISOString().split("T")[0],
      status: "active",
    };
    setSuppliers([...suppliers, newSupplier]);
    setIsAddDialogOpen(false);
    toast({
      title: "Supplier Added",
      description: "New supplier has been added successfully.",
    });
  };

  const handleRecordPayment = (supplierId: string, amount: number) => {
    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === supplierId
          ? {
              ...supplier,
              outstandingAmount: Math.max(
                0,
                supplier.outstandingAmount - amount,
              ),
            }
          : supplier,
      ),
    );
    setIsPaymentDialogOpen(false);
    setSelectedSupplier(null);
    toast({
      title: "Payment Recorded",
      description: `Payment of ₹${amount.toLocaleString()} has been recorded.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("suppliers")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage supplier relationships and outstanding payments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <AddSupplierDialog onAdd={handleAddSupplier} />
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSuppliers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeSuppliers} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalOutstanding.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending payments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalPurchases.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">30 days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Payment period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>
              Manage your supplier database and track payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suppliers Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Total Purchases</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {supplier.contactPerson}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₹{supplier.outstandingAmount.toLocaleString()}
                        </div>
                        {supplier.outstandingAmount > 0 && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Payment due
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        ₹{supplier.totalPurchases.toLocaleString()}
                      </TableCell>
                      <TableCell>{supplier.lastOrderDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(supplier.status)}>
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/suppliers/${supplier.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {supplier.outstandingAmount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              <DollarSign className="mr-1 h-4 w-4" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for {selectedSupplier?.name}
              </DialogDescription>
            </DialogHeader>
            <PaymentDialog
              supplier={selectedSupplier}
              onPayment={handleRecordPayment}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Add Supplier Dialog Component
function AddSupplierDialog({ onAdd }: { onAdd: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    paymentTerms: "30 days",
    category: "Electronics",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      paymentTerms: "30 days",
      category: "Electronics",
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogDescription>
          Add a new supplier to your database
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Supplier Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Parts">Parts</SelectItem>
              <SelectItem value="Displays">Displays</SelectItem>
              <SelectItem value="Batteries">Batteries</SelectItem>
              <SelectItem value="Tools">Tools</SelectItem>
              <SelectItem value="Accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Select
            value={formData.paymentTerms}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentTerms: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15 days">15 days</SelectItem>
              <SelectItem value="30 days">30 days</SelectItem>
              <SelectItem value="45 days">45 days</SelectItem>
              <SelectItem value="60 days">60 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="submit">Add Supplier</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Payment Dialog Component
function PaymentDialog({
  supplier,
  onPayment,
}: {
  supplier: any;
  onPayment: (supplierId: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > 0 && paymentAmount <= supplier?.outstandingAmount) {
      onPayment(supplier.id, paymentAmount);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Outstanding Amount</Label>
        <div className="text-lg font-semibold text-red-600">
          ₹{supplier?.outstandingAmount?.toLocaleString()}
        </div>
      </div>
      <div>
        <Label htmlFor="amount">Payment Amount</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          max={supplier?.outstandingAmount}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="check">Check</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          placeholder="Payment notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={!amount || parseFloat(amount) <= 0}>
          Record Payment
        </Button>
      </DialogFooter>
    </form>
  );
}
