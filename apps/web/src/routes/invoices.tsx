import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/invoices")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    total: number;
  }>;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string;
  paymentTerms: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>(
    "all"
  );
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  // Fetch invoice data and stats
  const invoicesQuery = useQuery({
    queryKey: ["invoices", { status: statusFilter, search: searchTerm }],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.invoices.list({ status: statusFilter });
    },
  });

  const statsQuery = useQuery({
    queryKey: ["invoiceStats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.invoices.stats();
    },
  });

  const invoices = invoicesQuery.data?.invoices || [];
  const stats = statsQuery.data;

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "sent":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "draft":
        return <Edit className="h-4 w-4 text-gray-500" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            className="bg-green-100 text-green-800 hover:bg-green-100"
            variant="default"
          >
            Paid
          </Badge>
        );
      case "sent":
        return (
          <Badge className="border-blue-200 text-blue-700" variant="outline">
            Sent
          </Badge>
        );
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-600" variant="secondary">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const isOverdue = (dueDate: string, status: InvoiceStatus) => {
    const today = new Date();
    const due = new Date(dueDate);
    return status === "sent" && due < today;
  };

  const handleStatusUpdate = async (
    invoiceId: string,
    newStatus: InvoiceStatus
  ) => {
    try {
      const { client } = await import("@/utils/orpc");
      await client.invoices.update({ id: invoiceId, status: newStatus });
      // Refetch data
      await invoicesQuery.refetch();
      await statsQuery.refetch();
    } catch (error) {
      console.error("Failed to update invoice status:", error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const { client } = await import("@/utils/orpc");
      await client.invoices.delete({ id: invoiceId });
      // Refetch data
      await invoicesQuery.refetch();
      await statsQuery.refetch();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Invoice Management
            </h1>
            <p className="text-muted-foreground">
              Create, manage, and track your client invoices and payments.
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => navigate({ to: "/invoices/new" })}
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </header>

      {/* Invoice Statistics */}
      <section aria-label="Invoice statistics" className="mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Invoices
                  </p>
                  <p className="font-bold text-2xl">
                    {stats?.totalInvoices || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Paid Invoices
                  </p>
                  <p className="font-bold text-2xl text-green-600">
                    {stats?.paidInvoices || 0}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Revenue
                  </p>
                  <p className="font-bold text-2xl">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Pending Revenue
                  </p>
                  <p className="font-bold text-2xl text-blue-600">
                    {formatCurrency(stats?.pendingRevenue || 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filters and Search */}
      <section aria-label="Invoice filters and search" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoices by client, invoice number, or email..."
                  value={searchTerm}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  onValueChange={(value) =>
                    setStatusFilter(value as typeof statusFilter)
                  }
                  value={statusFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={async () => {
                    const { toast } = await import("sonner");
                    toast.info("Export started", {
                      description: "Preparing invoice export...",
                    });
                  }}
                  size="icon"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Invoice Table */}
      <section aria-label="Invoice listing table">
        <Card>
          <CardHeader>
            <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
            <CardDescription>
              Manage all your client invoices and track payment status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const overdue = isOverdue(invoice.dueDate, invoice.status);
                  return (
                    <TableRow
                      className={`hover:bg-muted/50 ${overdue ? "bg-red-50" : ""}`}
                      key={invoice.id}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.clientName}</p>
                          <p className="text-muted-foreground text-xs">
                            {invoice.clientEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(overdue ? "overdue" : invoice.status)}
                          {getStatusBadge(overdue ? "overdue" : invoice.status)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center gap-1 ${overdue ? "text-red-600" : ""}`}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.subtotal)}</TableCell>
                      <TableCell>{formatCurrency(invoice.vatAmount)}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(invoice.total)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowInvoiceDetails(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/invoices/$id",
                                  params: { id: invoice.id },
                                })
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(invoice.id, "sent")
                                }
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            {invoice.status === "sent" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(invoice.id, "paid")
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={async () => {
                                const { toast } = await import("sonner");
                                toast.info("Generating PDF", {
                                  description: `Downloading invoice ${invoice.invoiceNumber}...`,
                                });
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredInvoices.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">
                  No invoices found
                </h3>
                <p className="text-muted-foreground">
                  Get started by creating your first invoice.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate({ to: "/invoices/new" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Invoice Details Dialog */}
      <Dialog onOpenChange={setShowInvoiceDetails} open={showInvoiceDetails}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              Invoice details and line items for {selectedInvoice?.clientName}.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{selectedInvoice.clientName}</p>
                    <p className="text-muted-foreground text-sm">
                      {selectedInvoice.clientEmail}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedInvoice.clientAddress}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{formatDate(selectedInvoice.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{formatDate(selectedInvoice.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(selectedInvoice.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Payment Terms:
                      </span>
                      <span>{selectedInvoice.paymentTerms}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>VAT Rate</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.description}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell>{item.vatRate}%</TableCell>
                          <TableCell>{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Invoice Totals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT:</span>
                      <span>{formatCurrency(selectedInvoice.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3 font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </div>
                  {selectedInvoice.notes && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="mb-2 font-medium">Notes:</h4>
                      <p className="text-muted-foreground text-sm">
                        {selectedInvoice.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={async () => {
                    const { toast } = await import("sonner");
                    toast.info("Generating PDF", {
                      description: `Downloading invoice ${selectedInvoice.invoiceNumber}...`,
                    });
                  }}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => {
                    setShowInvoiceDetails(false);
                    navigate({
                      to: "/invoices/$id",
                      params: { id: selectedInvoice.id },
                    });
                  }}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Invoice
                </Button>
                <Button
                  onClick={async () => {
                    await handleStatusUpdate(selectedInvoice.id, "sent");
                    const { toast } = await import("sonner");
                    toast.success("Invoice sent", {
                      description: `Invoice ${selectedInvoice.invoiceNumber} has been sent to ${selectedInvoice.clientEmail}`,
                    });
                    setShowInvoiceDetails(false);
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Send to Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
