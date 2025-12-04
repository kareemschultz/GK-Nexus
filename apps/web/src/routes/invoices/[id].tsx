import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  Edit,
  FileText,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/invoices/id")({
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

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
};

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
  items: InvoiceItem[];
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
  const { id } = Route.useParams();

  const [isEditing, setIsEditing] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Fetch invoice data
  const invoiceQuery = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.invoices.getById({ id });
    },
  });

  // Update mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      status?: InvoiceStatus;
      items?: InvoiceItem[];
      dueDate?: string;
      notes?: string;
      paymentTerms?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.invoices.update(data);
    },
    onSuccess: () => {
      invoiceQuery.refetch();
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Failed to update invoice:", error);
    },
  });

  // Delete mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.invoices.delete({ id });
    },
    onSuccess: () => {
      navigate({ to: "/invoices" });
    },
    onError: (error) => {
      console.error("Failed to delete invoice:", error);
    },
  });

  const invoice = invoiceQuery.data;

  // Initialize form data when invoice loads
  useEffect(() => {
    if (invoice) {
      setDueDate(invoice.dueDate);
      setPaymentTerms(invoice.paymentTerms);
      setNotes(invoice.notes || "");
      setItems(invoice.items);
    }
  }, [invoice]);

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "sent":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "draft":
        return <Edit className="h-4 w-4 text-gray-500" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
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

  const calculateItemTotal = (item: Omit<InvoiceItem, "id" | "total">) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = (subtotal * item.vatRate) / 100;
    return subtotal + vatAmount;
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      vatRate: 20,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const updateItem = (
    itemId: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (
            field === "quantity" ||
            field === "unitPrice" ||
            field === "vatRate"
          ) {
            updatedItem.total = calculateItemTotal(updatedItem);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleSaveChanges = () => {
    updateInvoiceMutation.mutate({
      id,
      items,
      dueDate,
      notes: notes || undefined,
      paymentTerms,
    });
  };

  const handleStatusUpdate = (newStatus: InvoiceStatus) => {
    updateInvoiceMutation.mutate({
      id,
      status: newStatus,
    });
  };

  const handleDeleteInvoice = () => {
    if (
      confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      deleteInvoiceMutation.mutate();
    }
  };

  const isOverdue = (dueDate: string, status: InvoiceStatus) => {
    const today = new Date();
    const due = new Date(dueDate);
    return status === "sent" && due < today;
  };

  // Calculate totals for editing mode
  const editingSubtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const editingVatAmount = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + (itemSubtotal * item.vatRate) / 100;
  }, 0);
  const editingTotal = editingSubtotal + editingVatAmount;

  if (invoiceQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (invoiceQuery.error || !invoice) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <h1 className="font-bold text-2xl">Invoice Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The requested invoice could not be found.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate({ to: "/invoices" })}
          >
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const actualStatus = isOverdue(invoice.dueDate, invoice.status)
    ? "overdue"
    : invoice.status;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate({ to: "/invoices" })}
              size="icon"
              variant="ghost"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                {getStatusIcon(actualStatus)}
                {getStatusBadge(actualStatus)}
                {actualStatus === "overdue" && (
                  <span className="font-medium text-red-600 text-sm">
                    Due {formatDate(invoice.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button
                  disabled={invoice.status === "paid"}
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                {invoice.status === "draft" && (
                  <Button onClick={() => handleStatusUpdate("sent")}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </Button>
                )}
                {invoice.status === "sent" && (
                  <Button onClick={() => handleStatusUpdate("paid")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
              </>
            )}

            {isEditing && (
              <>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data
                    setDueDate(invoice.dueDate);
                    setPaymentTerms(invoice.paymentTerms);
                    setNotes(invoice.notes || "");
                    setItems(invoice.items);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={updateInvoiceMutation.isPending}
                  onClick={handleSaveChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Invoice Header */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <h3 className="font-medium">{invoice.clientName}</h3>
              <p className="text-muted-foreground text-sm">
                {invoice.clientEmail}
              </p>
              <p className="text-muted-foreground text-sm">
                {invoice.clientAddress}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date:</Label>
                  <Input
                    id="dueDate"
                    onChange={(e) => setDueDate(e.target.value)}
                    type="date"
                    value={dueDate}
                  />
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span
                    className={
                      actualStatus === "overdue"
                        ? "font-medium text-red-600"
                        : ""
                    }
                  >
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms:</Label>
                  <Select onValueChange={setPaymentTerms} value={paymentTerms}>
                    <SelectTrigger id="paymentTerms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Due on Receipt">
                        Due on Receipt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Terms:</span>
                  <span>{invoice.paymentTerms}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span>{invoice.currency}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Items</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Edit the items in this invoice."
                    : "Services and products in this invoice."}
                </CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addItem} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead className="w-[120px]">Unit Price</TableHead>
                  <TableHead className="w-[100px]">VAT Rate</TableHead>
                  <TableHead className="w-[120px]">Total</TableHead>
                  {isEditing && (
                    <TableHead className="w-[50px]">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isEditing ? items : invoice.items).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Service or product description"
                          value={item.description}
                        />
                      ) : (
                        <span className="font-medium">{item.description}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          min="0"
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          step="1"
                          type="number"
                          value={item.quantity}
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          min="0"
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          step="0.01"
                          type="number"
                          value={item.unitPrice}
                        />
                      ) : (
                        formatCurrency(item.unitPrice)
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Select
                          onValueChange={(value) =>
                            updateItem(
                              item.id,
                              "vatRate",
                              Number.parseInt(value)
                            )
                          }
                          value={item.vatRate.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="25">25%</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        `${item.vatRate}%`
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(item.total)}
                      </span>
                    </TableCell>

                    {isEditing && (
                      <TableCell>
                        <Button
                          disabled={items.length === 1}
                          onClick={() => removeItem(item.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or terms..."
                    rows={4}
                    value={notes}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {invoice.notes || "No additional notes."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>
                    {formatCurrency(
                      isEditing ? editingSubtotal : invoice.subtotal
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT:</span>
                  <span>
                    {formatCurrency(
                      isEditing ? editingVatAmount : invoice.vatAmount
                    )}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(isEditing ? editingTotal : invoice.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {!isEditing && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {invoice.status === "draft" && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate("sent")}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send to Client
                    </Button>
                  )}

                  {invoice.status === "sent" && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate("paid")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Paid
                    </Button>
                  )}

                  {(invoice.status === "draft" ||
                    invoice.status === "sent") && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate("cancelled")}
                      variant="outline"
                    >
                      Cancel Invoice
                    </Button>
                  )}

                  <Button className="w-full" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Send Payment Link
                  </Button>

                  <Button
                    className="w-full"
                    disabled={invoice.status === "paid"}
                    onClick={handleDeleteInvoice}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Invoice
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
