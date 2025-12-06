// Type declarations for optional dependencies
// These modules are dynamically imported and may not always be present

declare module "xlsx" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const XLSX: any;
  export default XLSX;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const utils: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const writeFile: any;
}

declare module "jspdf" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class jsPDF {
    constructor(options?: any);
    text(text: string, x: number, y: number): jsPDF;
    save(filename: string): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
  export default jsPDF;
}

declare module "jspdf-autotable" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export default function autoTable(doc: any, options: any): void;
}

declare module "jest-axe" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function axe(html: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function toHaveNoViolations(results: any): any;
}
