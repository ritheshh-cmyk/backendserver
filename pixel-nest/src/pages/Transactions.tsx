import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "@/contexts/ConnectionContext";

interface Transaction {
  id: string;
  date: Date;
  customer: string;
  phone: string;
  device: string;
  repairType: string;
  cost: number;
  amount?: number;
  profit: number;
  status: "pending" | "in-progress" | "completed" | "delivered";
  paymentMethod: "cash" | "upi" | "card" | "bank-transfer";
  freeGlass: boolean;
  supplier?: string;
}

const statusConfig = {
  pending: { label: "pending", color: "status-pending" },
  "in-progress": { label: "in-progress", color: "status-progress" },
  completed: { label: "completed", color: "status-completed" },
  delivered: { label: "delivered", color: "status-delivered" },
};

export default function Transactions() {
  const queryClient = useQueryClient();
  const { socket } = useConnection();
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const { t } = useLanguage();

  // Fetch transactions from backend
  const { data = [], isLoading, isError } = useQuery<Transaction[]>(
    ["transactions"],
    async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const json = await res.json();
      // Convert date strings to Date objects
      return json.map((tx: any) => ({ ...tx, date: new Date(tx.date) }));
    },
    { refetchOnWindowFocus: false }
  );

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const onCreated = (transaction: Transaction) => {
      queryClient.setQueryData<Transaction[]>(["transactions"], (old = []) => [transaction, ...old]);
      toast({ title: "Transaction Created", description: transaction.id });
    };
    const onUpdated = (transaction: Transaction) => {
      queryClient.setQueryData<Transaction[]>(["transactions"], (old = []) =>
        old.map((tx) => (tx.id === transaction.id ? transaction : tx))
      );
      toast({ title: "Transaction Updated", description: transaction.id });
    };
    const onDeleted = (id: string) => {
      queryClient.setQueryData<Transaction[]>(["transactions"], (old = []) =>
        old.filter((tx) => tx.id !== id)
      );
      toast({ title: "Transaction Deleted", description: id, variant: "destructive" });
    };
    socket.on("transactionCreated", onCreated);
    socket.on("transactionUpdated", onUpdated);
    socket.on("transactionDeleted", onDeleted);
    return () => {
      socket.off("transactionCreated", onCreated);
      socket.off("transactionUpdated", onUpdated);
      socket.off("transactionDeleted", onDeleted);
    };
  }, [socket, queryClient]);

  const columnHelper = createColumnHelper<Transaction>();

  // Defensive profit calculation and summary
  const safeData: Transaction[] = Array.isArray(data) ? data : [];
  const totalProfit = safeData.reduce(
    (sum, tx) => sum + (tx.profit ?? ((tx.amount ?? 0) - (tx.cost ?? 0))),
    0
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Transaction ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue("id") || "N/A"}</div>
        ),
      }),
      columnHelper.accessor("date", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue<Date>("date");
          return <div className="text-sm">{date ? date.toLocaleDateString() : "N/A"}</div>;
        },
      }),
      columnHelper.accessor("customer", {
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue("customer") || "Unknown"}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {row.original.phone || "N/A"}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("device", {
        header: "Device",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue("device") || "N/A"}</div>
            <div className="text-xs text-muted-foreground">
              {t(row.original.repairType) || "N/A"}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("cost", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Cost
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-semibold">
              ₹{(row.getValue<number>("cost") ?? 0).toLocaleString()}
            </div>
            {showProfits && (
              <div className="text-xs text-success">
                Profit: ₹{(row.original.profit ?? ((row.original.amount ?? 0) - (row.original.cost ?? 0))).toLocaleString()}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("profit", {
        header: "Profit",
        cell: ({ row }) => {
          const profit = row.original.profit ?? ((row.original.amount ?? 0) - (row.original.cost ?? 0));
          return <div className="text-success font-semibold">₹{profit.toLocaleString()}</div>;
        },
      }),
      columnHelper.accessor("supplier", {
        header: "Supplier",
        cell: ({ row }) => (
          <div>{row.original.supplier || "Default Supplier"}</div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue<keyof typeof statusConfig>("status");
          return (
            <Badge className={cn("text-xs", statusConfig[status].color)}>
              {t(statusConfig[status].label)}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("paymentMethod", {
        header: "Payment",
        cell: ({ row }) => (
          <div className="text-sm">
            {t(row.getValue("paymentMethod"))}
            {row.original.freeGlass && (
              <div className="text-xs text-success">+ Free Glass</div>
            )}
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" data-testid="edit-transaction">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(row.original.id)}
              >
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/transactions/${row.original.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit transaction
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(row.original.id)}
                data-testid="delete-transaction"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete transaction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [showProfits, t],
  );

  const filteredData = useMemo(() => {
    return data.filter((transaction) => {
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" || transaction.paymentMethod === paymentFilter;
      return matchesStatus && matchesPayment;
    });
  }, [data, statusFilter, paymentFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
  });

  const handleDelete = async (id: string) => {
    if (!id) {
      toast({ title: "Delete Failed", description: "Invalid transaction ID" });
      return;
    }
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete transaction");
      queryClient.setQueryData<Transaction[]>(["transactions"], (old) =>
        (Array.isArray(old) ? old : ([] as Transaction[])).filter((tx) => tx.id !== id)
      );
      toast({
        title: "Transaction Deleted",
        description: "Transaction has been removed successfully."
      });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message
      });
    }
  };

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
  };

  const exportToExcel = () => {
    // In a real app, this would export to Excel
    toast({
      title: "Export Started",
      description: "Exporting transactions to Excel format...",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 data-testid="transactions-title" className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("transactions")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and track all repair transactions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleProfits}
              className="h-10 sm:h-9"
              data-testid="toggle-profits"
            >
              {showProfits ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {showProfits ? "Hide Profits" : "Show Profits"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="h-10 sm:h-9"
              data-testid="export-transactions"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
            <Link to="/transactions/new">
              <Button size="sm" className="h-10 sm:h-9" data-testid="add-transaction">
                <Plus className="mr-2 h-4 w-4" />
                {t("new-transaction")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`${t("search")} transactions...`}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="in-progress">
                      {t("in-progress")}
                    </SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="delivered">{t("delivered")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="cash">{t("cash")}</SelectItem>
                    <SelectItem value="upi">{t("upi")}</SelectItem>
                    <SelectItem value="card">{t("card")}</SelectItem>
                    <SelectItem value="bank-transfer">
                      {t("bank-transfer")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction List</CardTitle>
            <CardDescription>
              {table.getFilteredRowModel().rows.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table data-testid="transactions-table">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()} pages
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
