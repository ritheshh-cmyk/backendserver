import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Edit,
  Trash2,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const mockInventoryItems = [
  {
    id: 1,
    name: "iPhone 14 Pro Screen",
    category: "Display",
    compatibleDevices: ["iPhone 14 Pro"],
    purchaseCost: 8000,
    sellingPrice: 12000,
    currentStock: 2,
    minStockLevel: 5,
    supplier: "TechParts Ltd",
    lastRestocked: "2024-01-10",
    status: "critical",
  },
  {
    id: 2,
    name: "Samsung S23 Battery",
    category: "Battery",
    compatibleDevices: ["Samsung Galaxy S23"],
    purchaseCost: 1500,
    sellingPrice: 2500,
    currentStock: 8,
    minStockLevel: 10,
    supplier: "Mobile Components Inc",
    lastRestocked: "2024-01-12",
    status: "low",
  },
  {
    id: 3,
    name: "USB-C Charging Port",
    category: "Charging Port",
    compatibleDevices: ["OnePlus 11", "Samsung Galaxy S23", "Google Pixel 7"],
    purchaseCost: 800,
    sellingPrice: 1500,
    currentStock: 15,
    minStockLevel: 8,
    supplier: "Repair Supply Co",
    lastRestocked: "2024-01-08",
    status: "good",
  },
  {
    id: 4,
    name: "iPhone 13 Camera Module",
    category: "Camera",
    compatibleDevices: ["iPhone 13", "iPhone 13 Pro"],
    purchaseCost: 3000,
    sellingPrice: 5000,
    currentStock: 1,
    minStockLevel: 3,
    supplier: "TechParts Ltd",
    lastRestocked: "2024-01-05",
    status: "critical",
  },
  {
    id: 5,
    name: "Screen Protectors (Universal)",
    category: "Accessories",
    compatibleDevices: ["Universal"],
    purchaseCost: 50,
    sellingPrice: 200,
    currentStock: 45,
    minStockLevel: 20,
    supplier: "Digital Parts Hub",
    lastRestocked: "2024-01-14",
    status: "good",
  },
];

const categories = [
  "Display",
  "Battery",
  "Charging Port",
  "Speaker",
  "Camera",
  "Accessories",
  "Tools",
];

const suppliers = [
  "TechParts Ltd",
  "Mobile Components Inc",
  "Repair Supply Co",
  "Digital Parts Hub",
];

const deviceModels = [
  "iPhone 15 Pro",
  "iPhone 15",
  "iPhone 14 Pro",
  "iPhone 14",
  "iPhone 13",
  "Samsung Galaxy S24",
  "Samsung Galaxy S23",
  "OnePlus 12",
  "Google Pixel 8",
  "Universal",
];

export default function Inventory() {
  const [items, setItems] = useState(mockInventoryItems);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    compatibleDevices: [] as string[],
    purchaseCost: "",
    sellingPrice: "",
    currentStock: "",
    minStockLevel: "",
    supplier: "",
    notes: "",
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (item: any) => {
    const stockPercentage = (item.currentStock / item.minStockLevel) * 100;

    if (stockPercentage <= 50) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      );
    } else if (stockPercentage <= 100) {
      return (
        <Badge variant="warning" className="text-xs">
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="text-xs">
          Good
        </Badge>
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem = {
      id: Date.now(),
      ...formData,
      purchaseCost: parseFloat(formData.purchaseCost) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      currentStock: parseInt(formData.currentStock) || 0,
      minStockLevel: parseInt(formData.minStockLevel) || 0,
      lastRestocked: new Date().toISOString().split("T")[0],
      status: "good",
    };

    if (editingItem) {
      setItems(
        items.map((item) => (item.id === editingItem.id ? newItem : item)),
      );
    } else {
      setItems([...items, newItem]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      compatibleDevices: [],
      purchaseCost: "",
      sellingPrice: "",
      currentStock: "",
      minStockLevel: "",
      supplier: "",
      notes: "",
    });
    setEditingItem(null);
    setShowAddDialog(false);
  };

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name,
      category: item.category,
      compatibleDevices: item.compatibleDevices,
      purchaseCost: item.purchaseCost.toString(),
      sellingPrice: item.sellingPrice.toString(),
      currentStock: item.currentStock.toString(),
      minStockLevel: item.minStockLevel.toString(),
      supplier: item.supplier,
      notes: "",
    });
    setEditingItem(item);
    setShowAddDialog(true);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const totalValue = items.reduce(
    (sum, item) => sum + item.currentStock * item.purchaseCost,
    0,
  );
  const lowStockItems = items.filter(
    (item) => item.currentStock <= item.minStockLevel,
  ).length;
  const criticalItems = items.filter(
    (item) => item.currentStock <= item.minStockLevel * 0.5,
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Inventory Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your repair parts and stock levels
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Inventory Item" : "Add New Item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem
                      ? "Update the inventory item details"
                      : "Add a new item to your inventory"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Part Name *</Label>
                      <Input
                        id="name"
                        placeholder="iPhone 14 Pro Screen"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchaseCost">Purchase Cost (₹) *</Label>
                      <Input
                        id="purchaseCost"
                        type="number"
                        placeholder="0"
                        value={formData.purchaseCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchaseCost: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice">Selling Price (��) *</Label>
                      <Input
                        id="sellingPrice"
                        type="number"
                        placeholder="0"
                        value={formData.sellingPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sellingPrice: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Current Stock *</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        placeholder="0"
                        value={formData.currentStock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentStock: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStockLevel">Min Stock Alert *</Label>
                      <Input
                        id="minStockLevel"
                        type="number"
                        placeholder="0"
                        value={formData.minStockLevel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minStockLevel: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select
                      value={formData.supplier}
                      onValueChange={(value) =>
                        setFormData({ ...formData, supplier: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? "Update Item" : "Add Item"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">Active inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Inventory value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {lowStockItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Items need restock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {criticalItems}
              </div>
              <p className="text-xs text-muted-foreground">Urgent restock</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              {filteredItems.length} items found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Cost/Price</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const stockPercentage =
                      (item.currentStock / item.minStockLevel) * 100;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.compatibleDevices.join(", ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {item.currentStock}
                              </span>
                              <span className="text-muted-foreground">
                                / {item.minStockLevel}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(stockPercentage, 100)}
                              className="h-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              Cost: ₹{item.purchaseCost.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              Price: ₹{item.sellingPrice.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{item.supplier}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
