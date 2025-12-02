import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  Receipt,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/portal/payments")({
  component: PaymentsPage,
});

interface InvoiceView {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: string;
  category: string;
  services: string[];
  paidDate?: string;
  paymentMethod?: string;
  partialAmount?: number;
}

const paymentMethods = [
  {
    id: 1,
    type: "bank_transfer",
    name: "Bank Transfer",
    details: "Republic Bank Ltd. - Account: 123456789",
    preferred: true,
  },
  {
    id: 2,
    type: "credit_card",
    name: "Credit/Debit Card",
    details: "Visa, Mastercard accepted",
    preferred: false,
  },
  {
    id: 3,
    type: "paypal",
    name: "PayPal",
    details: "Secure online payments",
    preferred: false,
  },
  {
    id: 4,
    type: "crypto",
    name: "Cryptocurrency",
    details: "Bitcoin, Ethereum accepted",
    preferred: false,
  },
];

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "default";
    case "outstanding":
    case "draft":
    case "sent":
      return "secondary";
    case "overdue":
      return "destructive";
    case "partially_paid":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return <CheckCircle2 aria-hidden="true" className="h-4 w-4" />;
    case "outstanding":
    case "draft":
    case "sent":
      return <Clock aria-hidden="true" className="h-4 w-4" />;
    case "overdue":
      return <AlertTriangle aria-hidden="true" className="h-4 w-4" />;
    case "partially_paid":
      return <DollarSign aria-hidden="true" className="h-4 w-4" />;
    default:
      return <Receipt aria-hidden="true" className="h-4 w-4" />;
  }
}

function getCategoryColor(category: string) {
  switch (category?.toLowerCase()) {
    case "consulting":
      return "bg-blue-50 dark:bg-blue-950 text-blue-600";
    case "compliance":
      return "bg-green-50 dark:bg-green-950 text-green-600";
    case "advisory":
      return "bg-purple-50 dark:bg-purple-950 text-purple-600";
    case "tax":
      return "bg-amber-50 dark:bg-amber-950 text-amber-600";
    case "setup":
      return "bg-red-50 dark:bg-red-950 text-red-600";
    case "monthly":
      return "bg-gray-50 dark:bg-gray-950 text-gray-600";
    default:
      return "bg-gray-50 dark:bg-gray-950 text-gray-600";
  }
}

function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceView | null>(
    null
  );
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Fetch invoices from API
  const { data: invoicesResponse, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.invoices.list({ page: 1, limit: 100 });
    },
  });

  // Map API response to component format
  const invoices: InvoiceView[] = (invoicesResponse?.data?.items || []).map(
    (inv: any) => ({
      id: inv.id,
      invoiceNumber:
        inv.invoiceNumber || `INV-${inv.id.slice(0, 8).toUpperCase()}`,
      description: inv.notes || inv.description || "Invoice",
      amount: Number(inv.totalAmount) || 0,
      currency: inv.currency || "GYD",
      issueDate: inv.issueDate || inv.createdAt,
      dueDate: inv.dueDate || inv.createdAt,
      status: inv.status || "draft",
      category: inv.category || "consulting",
      services:
        inv.items?.map((item: any) => item.description || item.name) || [],
      paidDate: inv.paidDate,
      paymentMethod: inv.paymentMethod,
      partialAmount: inv.paidAmount ? Number(inv.paidAmount) : undefined,
    })
  );

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.services.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus =
      filterStatus === "all" || invoice.status.toLowerCase() === filterStatus;
    const matchesCategory =
      filterCategory === "all" ||
      invoice.category.toLowerCase() === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalOutstanding = invoices
    .filter(
      (inv) =>
        inv.status.toLowerCase() === "outstanding" ||
        inv.status.toLowerCase() === "overdue" ||
        inv.status.toLowerCase() === "sent" ||
        inv.status.toLowerCase() === "partially_paid"
    )
    .reduce((sum, inv) => {
      const remaining =
        inv.status.toLowerCase() === "partially_paid"
          ? inv.amount - (inv.partialAmount || 0)
          : inv.amount;
      return sum + remaining;
    }, 0);

  const totalPaidThisYear = invoices
    .filter(
      (inv) =>
        inv.status.toLowerCase() === "paid" &&
        inv.paidDate &&
        new Date(inv.paidDate).getFullYear() === new Date().getFullYear()
    )
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueCount = invoices.filter(
    (inv) => inv.status.toLowerCase() === "overdue"
  ).length;

  const handleMakePayment = (invoice: InvoiceView) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    // In real app, this would process the payment
    console.log("Processing payment for:", selectedInvoice?.invoiceNumber);
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-3xl text-foreground">Payments</h1>
        <p className="text-muted-foreground">
          View your payment history, outstanding invoices, and make payments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-red-50 p-2 dark:bg-red-950">
                <AlertTriangle
                  aria-hidden="true"
                  className="h-4 w-4 text-red-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  GYD {totalOutstanding.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-green-50 p-2 dark:bg-green-950">
                <CheckCircle2
                  aria-hidden="true"
                  className="h-4 w-4 text-green-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  GYD {totalPaidThisYear.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs">Paid This Year</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-amber-50 p-2 dark:bg-amber-950">
                <Clock aria-hidden="true" className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {overdueCount}
                </p>
                <p className="text-muted-foreground text-xs">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-blue-50 p-2 dark:bg-blue-950">
                <Receipt aria-hidden="true" className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {invoices.length}
                </p>
                <p className="text-muted-foreground text-xs">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Payments */}
      {invoices.filter(
        (inv) =>
          inv.status.toLowerCase() === "outstanding" ||
          inv.status.toLowerCase() === "overdue" ||
          inv.status.toLowerCase() === "sent"
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle
                aria-hidden="true"
                className="h-5 w-5 text-amber-600"
              />
              <span>Outstanding Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices
                .filter(
                  (inv) =>
                    inv.status.toLowerCase() === "outstanding" ||
                    inv.status.toLowerCase() === "overdue" ||
                    inv.status.toLowerCase() === "sent"
                )
                .map((invoice) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    key={invoice.id}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`rounded-full p-2 ${
                          invoice.status.toLowerCase() === "overdue"
                            ? "bg-red-50 dark:bg-red-950"
                            : "bg-amber-50 dark:bg-amber-950"
                        }`}
                      >
                        {getStatusIcon(invoice.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {invoice.description}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {invoice.currency} {invoice.amount.toLocaleString()}
                        </p>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status.toLowerCase() === "overdue"
                            ? "OVERDUE"
                            : "Outstanding"}
                        </Badge>
                      </div>
                      <Button
                        className={
                          invoice.status.toLowerCase() === "overdue"
                            ? "bg-red-600 hover:bg-red-700"
                            : ""
                        }
                        onClick={() => handleMakePayment(invoice)}
                      >
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard aria-hidden="true" className="h-5 w-5" />
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground"
              />
              <Input
                aria-label="Search invoices"
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices..."
                value={searchQuery}
              />
            </div>
            <Select onValueChange={setFilterStatus} value={filterStatus}>
              <SelectTrigger
                aria-label="Filter by status"
                className="w-full sm:w-48"
              >
                <Filter aria-hidden="true" className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterCategory} value={filterCategory}>
              <SelectTrigger
                aria-label="Filter by category"
                className="w-full sm:w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="advisory">Advisory</SelectItem>
                <SelectItem value="tax">Tax Services</SelectItem>
                <SelectItem value="setup">Setup</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs className="space-y-4" defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="cards">Card View</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow className="hover:bg-muted/50" key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {invoice.invoiceNumber}
                            </p>
                            <Badge
                              className={`text-xs ${getCategoryColor(invoice.category)}`}
                              variant="outline"
                            >
                              {invoice.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-foreground">
                            {invoice.description}
                          </p>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {invoice.currency} {invoice.amount.toLocaleString()}
                          {invoice.status.toLowerCase() ===
                            "partially_paid" && (
                            <p className="text-muted-foreground text-xs">
                              Paid: {invoice.currency}{" "}
                              {(invoice.partialAmount || 0).toLocaleString()}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">
                              {invoice.status.replace("_", " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              aria-label={`View ${invoice.invoiceNumber}`}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye aria-hidden="true" className="h-4 w-4" />
                            </Button>
                            <Button
                              aria-label={`Download ${invoice.invoiceNumber}`}
                              size="sm"
                              variant="ghost"
                            >
                              <Download
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            </Button>
                            {(invoice.status.toLowerCase() === "outstanding" ||
                              invoice.status.toLowerCase() === "overdue" ||
                              invoice.status.toLowerCase() === "sent") && (
                              <Button
                                onClick={() => handleMakePayment(invoice)}
                                size="sm"
                              >
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
            </TabsContent>

            <TabsContent value="cards">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredInvoices.map((invoice) => (
                  <Card
                    className="transition-shadow hover:shadow-md"
                    key={invoice.id}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {invoice.invoiceNumber}
                            </h3>
                            <Badge
                              className={`mt-1 text-xs ${getCategoryColor(invoice.category)}`}
                              variant="outline"
                            >
                              {invoice.category}
                            </Badge>
                          </div>
                          <Badge variant={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1">
                              {invoice.status.replace("_", " ")}
                            </span>
                          </Badge>
                        </div>

                        <div>
                          <p className="mb-2 text-muted-foreground text-sm">
                            {invoice.description}
                          </p>
                          <div className="space-y-1">
                            {invoice.services
                              .slice(0, 2)
                              .map((service, idx) => (
                                <p
                                  className="text-muted-foreground text-xs"
                                  key={idx}
                                >
                                  • {service}
                                </p>
                              ))}
                            {invoice.services.length > 2 && (
                              <p className="text-muted-foreground text-xs">
                                + {invoice.services.length - 2} more services
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Amount:
                            </span>
                            <span className="font-medium text-foreground">
                              {invoice.currency}{" "}
                              {invoice.amount.toLocaleString()}
                            </span>
                          </div>
                          {invoice.status.toLowerCase() ===
                            "partially_paid" && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Remaining:
                              </span>
                              <span className="font-medium text-amber-600">
                                {invoice.currency}{" "}
                                {(
                                  invoice.amount - (invoice.partialAmount || 0)
                                ).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-muted-foreground text-xs">
                            <span>
                              Issued:{" "}
                              {new Date(invoice.issueDate).toLocaleDateString()}
                            </span>
                            <span>
                              Due:{" "}
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          {invoice.paidDate && (
                            <div className="flex justify-between text-muted-foreground text-xs">
                              <span>
                                Paid:{" "}
                                {new Date(
                                  invoice.paidDate
                                ).toLocaleDateString()}
                              </span>
                              <span>{invoice.paymentMethod}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            className="flex-1"
                            size="sm"
                            variant="outline"
                          >
                            <Eye aria-hidden="true" className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            className="flex-1"
                            size="sm"
                            variant="outline"
                          >
                            <Download
                              aria-hidden="true"
                              className="mr-1 h-4 w-4"
                            />
                            Download
                          </Button>
                          {(invoice.status.toLowerCase() === "outstanding" ||
                            invoice.status.toLowerCase() === "overdue" ||
                            invoice.status.toLowerCase() === "sent") && (
                            <Button
                              className="flex-1"
                              onClick={() => handleMakePayment(invoice)}
                              size="sm"
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredInvoices.length === 0 && (
            <div className="py-12 text-center">
              <Receipt
                aria-hidden="true"
                className="mx-auto mb-4 h-12 w-12 text-muted-foreground"
              />
              <h3 className="mb-2 font-medium text-foreground text-lg">
                No invoices found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ||
                filterStatus !== "all" ||
                filterCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Your payment history will appear here as invoices are generated."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Banknote aria-hidden="true" className="h-5 w-5" />
            <span>Payment Methods</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {paymentMethods.map((method) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={method.id}
              >
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-muted p-2">
                    <CreditCard aria-hidden="true" className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {method.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {method.details}
                    </p>
                  </div>
                </div>
                {method.preferred && (
                  <Badge variant="secondary">Preferred</Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-muted p-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1 rounded-full bg-blue-100 p-1 dark:bg-blue-900">
                <FileText
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-600"
                />
              </div>
              <div>
                <h4 className="mb-2 font-medium text-foreground">
                  Payment Instructions
                </h4>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>
                    • Bank transfers typically process within 1-2 business days
                  </li>
                  <li>• Credit card payments are processed immediately</li>
                  <li>
                    • Please include your invoice number in payment references
                  </li>
                  <li>• Contact support for any payment-related questions</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog onOpenChange={setIsPaymentDialogOpen} open={isPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Complete payment for {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {selectedInvoice.invoiceNumber}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {selectedInvoice.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {selectedInvoice.currency}{" "}
                        {selectedInvoice.amount.toLocaleString()}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Due:{" "}
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    Select Payment Method
                  </h4>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div
                        className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                        key={method.id}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {method.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {method.details}
                          </p>
                        </div>
                        {method.preferred && (
                          <Badge className="text-xs" variant="secondary">
                            Preferred
                          </Badge>
                        )}
                        <ExternalLink
                          aria-hidden="true"
                          className="h-4 w-4 text-muted-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setIsPaymentDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit}>Continue to Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
