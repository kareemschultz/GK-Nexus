import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Check,
  Minus,
  Plus,
  Save,
  Send,
  Trash2,
  User,
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

export const Route = createFileRoute("/invoices/new")({
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

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
};

type CreateInvoiceData = {
  clientId: string;
  items: Omit<InvoiceItem, "id" | "total">[];
  dueDate: string;
  notes?: string;
  paymentTerms: string;
};

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      vatRate: 20,
      total: 0,
    },
  ]);

  // Fetch clients for dropdown
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.list({ limit: 100, offset: 0 });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const { client } = await import("@/utils/orpc");
      return client.invoices.create(data);
    },
    onSuccess: (invoice) => {
      navigate({ to: "/invoices/$id", params: { id: invoice.id } });
    },
    onError: (error) => {
      console.error("Failed to create invoice:", error);
    },
  });

  const clients = clientsQuery.data?.clients || [];
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Calculate totals
  const calculateItemTotal = (item: Omit<InvoiceItem, "id" | "total">) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = (subtotal * item.vatRate) / 100;
    return subtotal + vatAmount;
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatAmount = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + (itemSubtotal * item.vatRate) / 100;
  }, 0);
  const total = subtotal + vatAmount;

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

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
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

  const handleSaveAsDraft = () => {
    if (!selectedClientId || items.length === 0) {
      return;
    }

    const invoiceData: CreateInvoiceData = {
      clientId: selectedClientId,
      items: items.map(({ id, total, ...item }) => item),
      dueDate:
        dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      notes: notes || undefined,
      paymentTerms,
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const handleSendInvoice = () => {
    // In a real app, this would also send the invoice to the client
    handleSaveAsDraft();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getThirtyDaysFromNow = () => {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return thirtyDays.toISOString().split("T")[0];
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Create New Invoice
            </h1>
            <p className="text-muted-foreground">
              Generate a professional invoice for your client.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: "/invoices" })}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedClientId || createInvoiceMutation.isPending}
              onClick={handleSaveAsDraft}
              variant="outline"
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              disabled={!selectedClientId || createInvoiceMutation.isPending}
              onClick={handleSendInvoice}
            >
              <Send className="mr-2 h-4 w-4" />
              Create & Send
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
              <CardDescription>
                Select the client for this invoice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  onValueChange={setSelectedClientId}
                  value={selectedClientId}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex w-full items-center justify-between">
                          <span>{client.name}</span>
                          <Badge className="ml-2" variant="secondary">
                            {client.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && (
                <div className="space-y-2 rounded-lg bg-muted p-4">
                  <h4 className="font-medium">{selectedClient.name}</h4>
                  <p className="text-muted-foreground text-sm">
                    {selectedClient.contactPerson}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedClient.email}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedClient.address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    min={getTomorrowDate()}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder={getThirtyDaysFromNow()}
                    type="date"
                    value={dueDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
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
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice Items</CardTitle>
                  <CardDescription>
                    Add services or products to this invoice.
                  </CardDescription>
                </div>
                <Button onClick={addItem} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Description</TableHead>
                    <TableHead className="w-[100px]">Qty</TableHead>
                    <TableHead className="w-[120px]">Unit Price</TableHead>
                    <TableHead className="w-[100px]">VAT Rate</TableHead>
                    <TableHead className="w-[120px]">Total</TableHead>
                    <TableHead className="w-[50px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Service or product description"
                          value={item.description}
                        />
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Input
                          min="0"
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={item.unitPrice}
                        />
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(item.total)}
                        </span>
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Optional notes or terms for this invoice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business..."
                rows={4}
                value={notes}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT:</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Invoice Template Preview */}
              <div className="mt-6 border-t pt-4">
                <h4 className="mb-2 font-medium">Invoice Template</h4>
                <div className="space-y-2 rounded-lg border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>GYD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>
                      {dueDate
                        ? new Date(dueDate).toLocaleDateString()
                        : new Date(getThirtyDaysFromNow()).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terms:</span>
                    <span>{paymentTerms}</span>
                  </div>
                </div>
              </div>

              {/* Validation Status */}
              <div className="mt-4 border-t pt-4">
                <h4 className="mb-2 font-medium">Validation</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedClientId ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-red-500" />
                    )}
                    <span>Client selected</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {items.some(
                      (item) =>
                        item.description &&
                        item.quantity > 0 &&
                        item.unitPrice > 0
                    ) ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-red-500" />
                    )}
                    <span>Valid items added</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {total > 0 ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-red-500" />
                    )}
                    <span>Invoice has value</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={() => {
                  const newItem: InvoiceItem = {
                    id: Date.now().toString(),
                    description: "Compliance Audit Services",
                    quantity: 1,
                    unitPrice: 5000,
                    vatRate: 20,
                    total: 6000,
                  };
                  setItems([...items.filter((i) => i.description), newItem]);
                }}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Audit Service
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => {
                  const newItem: InvoiceItem = {
                    id: Date.now().toString(),
                    description: "Monthly Monitoring",
                    quantity: 1,
                    unitPrice: 800,
                    vatRate: 20,
                    total: 960,
                  };
                  setItems([...items.filter((i) => i.description), newItem]);
                }}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Monitoring Service
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => {
                  const newItem: InvoiceItem = {
                    id: Date.now().toString(),
                    description: "Consultation Services",
                    quantity: 1,
                    unitPrice: 150,
                    vatRate: 20,
                    total: 180,
                  };
                  setItems([...items.filter((i) => i.description), newItem]);
                }}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Consultation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
