/**
 * Export Utilities
 * Functions for exporting data to CSV, Excel, and PDF formats
 */

import { formatGYD } from "./tax-calculators";

// ============================================
// CSV Export
// ============================================

export type ExportColumn<T> = {
  key: keyof T | string;
  label: string;
  format?: (value: unknown, row: T) => string;
};

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Build CSV content
  const headers = columns.map((col) => `"${col.label}"`).join(",");

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = getNestedValue(row, col.key as string);
        const formatted = col.format
          ? col.format(value, row)
          : String(value ?? "");
        // Escape quotes and wrap in quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  // Create and download file
  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

// ============================================
// Excel Export (uses SheetJS/xlsx)
// ============================================

export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Sheet1"
): Promise<void> {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    // TODO: Install xlsx package - currently commented out to avoid build errors
    // Run: bun add xlsx
    // Dynamic import of xlsx library
    const XLSX = await import("xlsx");

    // Transform data with column formatting
    const formattedData = data.map((row) => {
      const formattedRow: Record<string, unknown> = {};
      for (const col of columns) {
        const value = getNestedValue(row, col.key as string);
        formattedRow[col.label] = col.format ? col.format(value, row) : value;
      }
      return formattedRow;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    const colWidths = columns.map((col) => ({
      wch: Math.max(
        col.label.length,
        ...data.map((row) => {
          const value = getNestedValue(row, col.key as string);
          const formatted = col.format
            ? col.format(value, row)
            : String(value ?? "");
          return formatted.length;
        })
      ),
    }));
    worksheet["!cols"] = colWidths;

    // Write file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch {
    console.error(
      "Failed to export to Excel. Make sure xlsx package is installed."
    );
    // Fallback to CSV
    exportToCSV(data, columns, filename);
  }
}

// ============================================
// PDF Export (uses jsPDF + autoTable)
// ============================================

export type PDFExportOptions = {
  title?: string;
  subtitle?: string;
  orientation?: "portrait" | "landscape";
  pageSize?: "a4" | "letter";
  headerColor?: [number, number, number];
};

export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  options: PDFExportOptions = {}
): Promise<void> {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const {
    title = "Export",
    subtitle,
    orientation = "portrait",
    pageSize = "a4",
    headerColor = [59, 130, 246], // blue-500
  } = options;

  try {
    // TODO: Install jspdf packages - currently commented out to avoid build errors
    // Run: bun add jspdf jspdf-autotable
    // Dynamic imports
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: pageSize,
    });

    // Add header
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(subtitle, 14, 28);
    }

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GY")}`,
      14,
      subtitle ? 34 : 28
    );

    // Prepare table data
    const tableHeaders = columns.map((col) => col.label);
    const tableBody = data.map((row) =>
      columns.map((col) => {
        const value = getNestedValue(row, col.key as string);
        return col.format ? col.format(value, row) : String(value ?? "");
      })
    );

    // Add table
    autoTable(doc, {
      startY: subtitle ? 40 : 34,
      head: [tableHeaders],
      body: tableBody,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 10, right: 14, bottom: 10, left: 14 },
    });

    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      (doc as { text: (text: string, x: number, y: number, options?: { align?: string }) => void }).text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      (doc as { text: (text: string, x: number, y: number, options?: { align?: string }) => void }).text(
        "GK-Nexus",
        doc.internal.pageSize.getWidth() - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    }

    // Save file
    doc.save(`${filename}.pdf`);
  } catch {
    console.error(
      "Failed to export to PDF. Make sure jspdf and jspdf-autotable packages are installed."
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return;
  }, obj);
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// ============================================
// Pre-built Column Configurations
// ============================================

export const clientExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { key: "name", label: "Client Name" },
  { key: "type", label: "Type" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "tinNumber", label: "TIN" },
  { key: "nisNumber", label: "NIS" },
  { key: "vatNumber", label: "VAT" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "region", label: "Region" },
  { key: "status", label: "Status" },
  {
    key: "createdAt",
    label: "Created",
    format: (value) =>
      value ? new Date(value as string).toLocaleDateString("en-GY") : "",
  },
];

export const filingExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { key: "clientName", label: "Client" },
  { key: "filingType", label: "Filing Type" },
  { key: "period", label: "Period" },
  { key: "status", label: "Status" },
  {
    key: "dueDate",
    label: "Due Date",
    format: (value) =>
      value ? new Date(value as string).toLocaleDateString("en-GY") : "",
  },
  {
    key: "submittedDate",
    label: "Submitted",
    format: (value) =>
      value ? new Date(value as string).toLocaleDateString("en-GY") : "",
  },
  {
    key: "amount",
    label: "Amount",
    format: (value) => (value ? formatGYD(value as number) : ""),
  },
];

// ============================================
// Print Function
// ============================================

export function printContent(elementId: string, title?: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Failed to open print window");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title ?? "Print"}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${title ? `<h1>${title}</h1>` : ""}
        ${element.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
