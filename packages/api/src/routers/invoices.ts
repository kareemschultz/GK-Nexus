import { z } from "zod";
import { protectedProcedure } from "../index";

// Guyana VAT rate is 14%
const GUYANA_VAT_RATE = 14;

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  vatRate: z.number().min(0).max(100).default(GUYANA_VAT_RATE),
  total: z.number().positive(),
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

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
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
  notes: string;
  paymentTerms: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

const mockInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    clientId: "1",
    clientName: "Guyana Sugar Corporation",
    clientEmail: "finance@guysuco.gy",
    clientAddress: "22 Church Street, Georgetown, Guyana",
    issueDate: "2024-11-01",
    dueDate: "2024-12-01",
    status: "sent",
    items: [
      {
        id: "item-1",
        description: "PAYE Filing Services - Q4 2024",
        quantity: 1,
        unitPrice: 150_000,
        vatRate: GUYANA_VAT_RATE,
        total: 171_000,
      },
      {
        id: "item-2",
        description: "NIS Compliance Review",
        quantity: 3,
        unitPrice: 50_000,
        vatRate: GUYANA_VAT_RATE,
        total: 171_000,
      },
    ],
    subtotal: 300_000,
    vatAmount: 42_000,
    total: 342_000,
    notes: "Thank you for your business.",
    paymentTerms: "Net 30",
    currency: "GYD",
    createdAt: "2024-11-01T09:00:00Z",
    updatedAt: "2024-11-01T09:00:00Z",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2024-002",
    clientId: "2",
    clientName: "Banks DIH Limited",
    clientEmail: "accounts@banksdih.com.gy",
    clientAddress: "Thirst Park, Georgetown, Guyana",
    issueDate: "2024-11-15",
    dueDate: "2024-12-15",
    status: "draft",
    items: [
      {
        id: "item-3",
        description: "Corporate Tax Filing - Year End 2024",
        quantity: 1,
        unitPrice: 250_000,
        vatRate: GUYANA_VAT_RATE,
        total: 285_000,
      },
    ],
    subtotal: 250_000,
    vatAmount: 35_000,
    total: 285_000,
    notes: "",
    paymentTerms: "Net 30",
    currency: "GYD",
    createdAt: "2024-11-15T14:30:00Z",
    updatedAt: "2024-11-15T14:30:00Z",
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2024-003",
    clientId: "3",
    clientName: "Demerara Distillers Limited",
    clientEmail: "finance@demrum.com",
    clientAddress: "Diamond, East Bank Demerara, Guyana",
    issueDate: "2024-10-15",
    dueDate: "2024-11-15",
    status: "paid",
    items: [
      {
        id: "item-4",
        description: "VAT Return Filing - September 2024",
        quantity: 1,
        unitPrice: 75_000,
        vatRate: GUYANA_VAT_RATE,
        total: 85_500,
      },
      {
        id: "item-5",
        description: "GRA Audit Representation",
        quantity: 2,
        unitPrice: 200_000,
        vatRate: GUYANA_VAT_RATE,
        total: 456_000,
      },
    ],
    subtotal: 475_000,
    vatAmount: 66_500,
    total: 541_500,
    notes: "Payment received via bank transfer.",
    paymentTerms: "Net 30",
    currency: "GYD",
    createdAt: "2024-10-15T11:00:00Z",
    updatedAt: "2024-11-16T16:45:00Z",
  },
];

// ========================================
// INVOICES (FLAT PROCEDURES)
// ========================================

// Get all invoices
export const invoiceList = protectedProcedure
  // .use(requirePermission("invoices.read"))
  .input(
    z.object({
      status: z
        .enum(["all", "draft", "sent", "paid", "overdue", "cancelled"])
        .default("all"),
      clientId: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
      page: z.number().optional(),
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
      // For portal/payments.tsx compatibility
      data: {
        items: paginatedInvoices,
        total: filteredInvoices.length,
      },
    };
  });

// Get single invoice by ID
export const invoiceGetById = protectedProcedure
  // .use(requirePermission("invoices.read"))
  .input(z.object({ id: z.string() }))
  .handler(({ input }) => {
    const invoice = mockInvoices.find((inv) => inv.id === input.id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return invoice;
  });

// Create new invoice
export const invoiceCreate = protectedProcedure
  // .use(requirePermission("invoices.create"))
  .input(createInvoiceSchema)
  .handler(({ input }) => {
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

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      clientId: input.clientId,
      clientName: "Mock Client",
      clientEmail: "client@example.com",
      clientAddress: "123 Client Street, City, State",
      issueDate: now.split("T")[0] ?? now,
      dueDate: input.dueDate,
      status: "draft",
      items: itemsWithIds,
      subtotal,
      vatAmount,
      total,
      notes: input.notes || "",
      paymentTerms: input.paymentTerms,
      currency: "GYD",
      createdAt: now,
      updatedAt: now,
    };

    mockInvoices.push(newInvoice);
    return newInvoice;
  });

// Update invoice
export const invoiceUpdate = protectedProcedure
  // .use(requirePermission("invoices.update"))
  .input(updateInvoiceSchema)
  .handler(({ input }) => {
    const invoiceIndex = mockInvoices.findIndex((inv) => inv.id === input.id);
    if (invoiceIndex === -1) {
      throw new Error("Invoice not found");
    }

    const existingInvoice = mockInvoices[invoiceIndex];
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }

    let subtotal = existingInvoice.subtotal;
    let vatAmount = existingInvoice.vatAmount;
    let total = existingInvoice.total;

    if (input.items) {
      subtotal = 0;
      vatAmount = 0;

      input.items.forEach((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemVat = (itemTotal * item.vatRate) / 100;
        subtotal += itemTotal;
        vatAmount += itemVat;
      });

      total = subtotal + vatAmount;
    }

    const updatedInvoice = {
      ...existingInvoice,
      status: input.status ?? existingInvoice.status,
      items: input.items ?? existingInvoice.items,
      dueDate: input.dueDate ?? existingInvoice.dueDate,
      notes: input.notes ?? existingInvoice.notes,
      paymentTerms: input.paymentTerms ?? existingInvoice.paymentTerms,
      subtotal,
      vatAmount,
      total,
      updatedAt: new Date().toISOString(),
    };

    mockInvoices[invoiceIndex] = updatedInvoice;
    return updatedInvoice;
  });

// Delete invoice
export const invoiceDelete = protectedProcedure
  // .use(requirePermission("invoices.delete"))
  .input(z.object({ id: z.string() }))
  .handler(({ input }) => {
    const invoiceIndex = mockInvoices.findIndex((inv) => inv.id === input.id);
    if (invoiceIndex === -1) {
      throw new Error("Invoice not found");
    }

    mockInvoices.splice(invoiceIndex, 1);
    return { success: true };
  });

// Get invoice statistics
export const invoiceStats = protectedProcedure
  // .use(requirePermission("invoices.read"))
  .handler(() => {
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
  });
