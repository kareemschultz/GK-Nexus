import { z } from "zod";
import { protectedProcedure } from "../index";

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  vatRate: z.number().min(0).max(100).default(20),
  total: z.number().positive(),
});

const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  clientEmail: z.string(),
  clientAddress: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  items: z.array(invoiceItemSchema),
  subtotal: z.number().positive(),
  vatAmount: z.number().min(0),
  total: z.number().positive(),
  notes: z.string().optional(),
  paymentTerms: z.string().default("Net 30"),
  currency: z.string().default("USD"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const createInvoiceSchema = z.object({
  clientId: z.string(),
  items: z.array(invoiceItemSchema.omit({ id: true })),
  dueDate: z.string(),
  notes: z.string().optional(),
  paymentTerms: z.string().default("Net 30"),
});

const updateInvoiceSchema = z.object({
  id: z.string(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  items: z.array(invoiceItemSchema).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
});

// Mock invoice data
const mockInvoices = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    clientId: "1",
    clientName: "TechCorp Inc.",
    clientEmail: "john.smith@techcorp.com",
    clientAddress: "123 Innovation Drive, Silicon Valley, CA",
    issueDate: "2024-11-01",
    dueDate: "2024-12-01",
    status: "sent" as const,
    items: [
      {
        id: "item-1",
        description: "Compliance Audit Services",
        quantity: 1,
        unitPrice: 5000,
        vatRate: 20,
        total: 6000,
      },
      {
        id: "item-2",
        description: "Monthly Monitoring",
        quantity: 3,
        unitPrice: 800,
        vatRate: 20,
        total: 2880,
      },
    ],
    subtotal: 7400,
    vatAmount: 1480,
    total: 8880,
    notes: "Thank you for your business.",
    paymentTerms: "Net 30",
    currency: "USD",
    createdAt: "2024-11-01T09:00:00Z",
    updatedAt: "2024-11-01T09:00:00Z",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2024-002",
    clientId: "2",
    clientName: "DataFlow Solutions",
    clientEmail: "sarah@dataflow.com",
    clientAddress: "456 Analytics Blvd, Austin, TX",
    issueDate: "2024-11-15",
    dueDate: "2024-12-15",
    status: "draft" as const,
    items: [
      {
        id: "item-3",
        description: "Data Privacy Assessment",
        quantity: 1,
        unitPrice: 3500,
        vatRate: 20,
        total: 4200,
      },
    ],
    subtotal: 3500,
    vatAmount: 700,
    total: 4200,
    notes: "",
    paymentTerms: "Net 30",
    currency: "USD",
    createdAt: "2024-11-15T14:30:00Z",
    updatedAt: "2024-11-15T14:30:00Z",
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2024-003",
    clientId: "3",
    clientName: "Green Energy Co.",
    clientEmail: "m.chen@greenenergy.com",
    clientAddress: "789 Sustainability St, Portland, OR",
    issueDate: "2024-10-15",
    dueDate: "2024-11-15",
    status: "paid" as const,
    items: [
      {
        id: "item-4",
        description: "Environmental Compliance Review",
        quantity: 1,
        unitPrice: 7500,
        vatRate: 20,
        total: 9000,
      },
      {
        id: "item-5",
        description: "Regulatory Documentation",
        quantity: 2,
        unitPrice: 1200,
        vatRate: 20,
        total: 2880,
      },
    ],
    subtotal: 9900,
    vatAmount: 1980,
    total: 11_880,
    notes: "Payment received via bank transfer.",
    paymentTerms: "Net 30",
    currency: "USD",
    createdAt: "2024-10-15T11:00:00Z",
    updatedAt: "2024-11-16T16:45:00Z",
  },
];

export const invoicesRouter = {
  // Get all invoices
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["all", "draft", "sent", "paid", "overdue", "cancelled"])
          .default("all"),
        clientId: z.string().optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .handler(({ input }) => {
      let filteredInvoices = mockInvoices;

      if (input.status !== "all") {
        filteredInvoices = filteredInvoices.filter(
          (inv) => inv.status === input.status
        );
      }

      if (input.clientId) {
        filteredInvoices = filteredInvoices.filter(
          (inv) => inv.clientId === input.clientId
        );
      }

      const paginatedInvoices = filteredInvoices.slice(
        input.offset,
        input.offset + input.limit
      );

      return {
        invoices: paginatedInvoices,
        total: filteredInvoices.length,
        hasMore: input.offset + input.limit < filteredInvoices.length,
      };
    }),

  // Get single invoice by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(({ input }) => {
      const invoice = mockInvoices.find((inv) => inv.id === input.id);
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      return invoice;
    }),

  // Create new invoice
  create: protectedProcedure.input(createInvoiceSchema).handler(({ input }) => {
    const invoiceNumber = `INV-2024-${String(mockInvoices.length + 1).padStart(3, "0")}`;
    const now = new Date().toISOString();

    // Calculate totals
    let subtotal = 0;
    let vatAmount = 0;

    const itemsWithIds = input.items.map((item, index) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemVat = (itemTotal * item.vatRate) / 100;
      subtotal += itemTotal;
      vatAmount += itemVat;

      return {
        ...item,
        id: `item-${Date.now()}-${index}`,
        total: itemTotal + itemVat,
      };
    });

    const total = subtotal + vatAmount;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      clientId: input.clientId,
      clientName: "Mock Client", // In real app, fetch from clients
      clientEmail: "client@example.com",
      clientAddress: "123 Client Street, City, State",
      issueDate: now.split("T")[0],
      dueDate: input.dueDate,
      status: "draft" as const,
      items: itemsWithIds,
      subtotal,
      vatAmount,
      total,
      notes: input.notes || "",
      paymentTerms: input.paymentTerms,
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    };

    mockInvoices.push(newInvoice);
    return newInvoice;
  }),

  // Update invoice
  update: protectedProcedure.input(updateInvoiceSchema).handler(({ input }) => {
    const invoiceIndex = mockInvoices.findIndex((inv) => inv.id === input.id);
    if (invoiceIndex === -1) {
      throw new Error("Invoice not found");
    }

    const updatedInvoice = {
      ...mockInvoices[invoiceIndex],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate totals if items were updated
    if (input.items) {
      let subtotal = 0;
      let vatAmount = 0;

      input.items.forEach((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemVat = (itemTotal * item.vatRate) / 100;
        subtotal += itemTotal;
        vatAmount += itemVat;
      });

      updatedInvoice.subtotal = subtotal;
      updatedInvoice.vatAmount = vatAmount;
      updatedInvoice.total = subtotal + vatAmount;
    }

    mockInvoices[invoiceIndex] = updatedInvoice;
    return updatedInvoice;
  }),

  // Delete invoice
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(({ input }) => {
      const invoiceIndex = mockInvoices.findIndex((inv) => inv.id === input.id);
      if (invoiceIndex === -1) {
        throw new Error("Invoice not found");
      }

      mockInvoices.splice(invoiceIndex, 1);
      return { success: true };
    }),

  // Get invoice statistics
  stats: protectedProcedure.handler(() => {
    const totalInvoices = mockInvoices.length;
    const paidInvoices = mockInvoices.filter(
      (inv) => inv.status === "paid"
    ).length;
    const pendingInvoices = mockInvoices.filter(
      (inv) => inv.status === "sent"
    ).length;
    const overdueInvoices = mockInvoices.filter(
      (inv) => inv.status === "overdue"
    ).length;
    const totalRevenue = mockInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingRevenue = mockInvoices
      .filter((inv) => inv.status === "sent")
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingRevenue,
      avgInvoiceValue: totalInvoices > 0 ? totalRevenue / paidInvoices : 0,
    };
  }),
};
