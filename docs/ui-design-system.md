# GK-Nexus UI/UX Design System

**Version**: 1.0
**Date**: November 2024
**Framework**: React 19 + Tailwind CSS + shadcn/ui + Lucide React

---

## 🎨 **Design Philosophy**

### **Core Principles**
- **Professional**: Enterprise-grade aesthetics for tax consultancy
- **Accessible**: WCAG 2.1 AA compliance for government requirements
- **Responsive**: Mobile-first with desktop optimization
- **Guyana-Centric**: Local cultural context and GRA brand guidelines

### **Visual Identity**
- **Primary Colors**: Professional blues and greens reflecting trust and growth
- **Typography**: Clean, readable fonts optimized for financial data
- **Iconography**: Lucide React icons with custom business illustrations
- **Spacing**: 8px grid system for consistent layouts

---

## 🎯 **Component Architecture**

### **Foundation Components**
Built on existing shadcn/ui with Guyana-specific enhancements:

#### **Color Palette**
```typescript
// apps/web/src/styles/tokens.css
:root {
  /* GK-Nexus Brand Colors */
  --primary: 212 100% 47%;           /* Professional Blue */
  --primary-foreground: 210 40% 98%;

  --secondary: 142 76% 36%;          /* Guyana Green */
  --secondary-foreground: 210 40% 98%;

  --accent: 38 92% 50%;              /* Golden Yellow (GRA colors) */
  --accent-foreground: 222.2 84% 4.9%;

  /* Functional Colors */
  --success: 142 71% 45%;            /* Tax completion green */
  --warning: 38 92% 50%;             /* Deadline warnings */
  --error: 0 84% 60%;                /* Validation errors */
  --info: 212 100% 47%;              /* Information notices */

  /* Neutral Grays */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
}
```

#### **Typography Scale**
```typescript
// apps/web/src/styles/typography.css
.text-display {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.text-heading-1 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.25;
}

.text-heading-2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.text-body-large {
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.6;
}

.text-body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

.text-caption {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
}
```

---

## 📱 **Layout Components**

### **Dashboard Layout**
```typescript
// apps/web/src/components/layouts/DashboardLayout.tsx
import { Building2, Menu, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">GK-Nexus</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-error rounded-full" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.jpg" />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### **Navigation Sidebar**
```typescript
// apps/web/src/components/navigation/Sidebar.tsx
import {
  Calculator, FileText, Users, Calendar, BarChart3,
  Settings, Home, Scale, Plane, Building2
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const navigationItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Calculator, label: "Tax Calculations", href: "/tax" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: Scale, label: "Compliance", href: "/compliance" },
  { icon: Plane, label: "Immigration", href: "/immigration" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Calendar, label: "Appointments", href: "/appointments" },
  { icon: Building2, label: "Business Setup", href: "/business" },
  { icon: Settings, label: "Settings", href: "/settings" },
] as const;

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r shadow-sm">
      <div className="p-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-primary/5 hover:text-primary",
                  isActive && "bg-primary/10 text-primary"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
```

---

## 🧮 **Business Components**

### **Tax Calculator Card**
```typescript
// apps/web/src/components/tax/TaxCalculatorCard.tsx
import { Calculator, Info, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TaxResult {
  grossSalary: number;
  taxableIncome: number;
  payeTax: number;
  netSalary: number;
  effectiveRate: number;
}

export function TaxCalculatorCard({ result }: { result: TaxResult }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            PAYE Tax Calculation
          </CardTitle>
          <Badge variant="secondary">GRA Compliant</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Gross Salary
            </label>
            <div className="text-2xl font-bold">
              ${result.grossSalary.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Net Salary
            </label>
            <div className="text-2xl font-bold text-success">
              ${result.netSalary.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm">Taxable Income:</span>
            <span className="font-medium">${result.taxableIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">PAYE Tax:</span>
            <span className="font-medium text-error">${result.payeTax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Effective Rate:</span>
            <span className="font-medium">{result.effectiveRate}%</span>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline" size="icon">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **Document Upload Zone**
```typescript
// apps/web/src/components/documents/UploadZone.tsx
import { Upload, File, X, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCallback, useState } from "react";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function UploadZone() {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(uploadFile => {
      const interval = setInterval(() => {
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, progress: Math.min(f.progress + 10, 100) }
            : f
        ));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));
      }, 2000);
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Upload className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
          <p className="text-muted-foreground text-center mb-4">
            Drag and drop your tax documents here, or click to browse
          </p>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>Supported: PDF, JPG, PNG</span>
            <span>•</span>
            <span>Max 10MB per file</span>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <File className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{file.file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.file.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>

              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="w-16" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                <Button variant="ghost" size="sm" onClick={() =>
                  setFiles(prev => prev.filter(f => f.id !== file.id))
                }>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### **Client Status Dashboard**
```typescript
// apps/web/src/components/clients/ClientDashboard.tsx
import { Users, FileText, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClientStats {
  totalClients: number;
  activeFilings: number;
  upcomingDeadlines: number;
  overdueItems: number;
}

export function ClientDashboard({ stats }: { stats: ClientStats }) {
  const metrics = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Filings",
      value: stats.activeFilings,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Upcoming Deadlines",
      value: stats.upcomingDeadlines,
      icon: Calendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Overdue Items",
      value: stats.overdueItems,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </div>
            {metric.title === "Overdue Items" && metric.value > 0 && (
              <Badge variant="destructive" className="mt-2">
                Needs Attention
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## 📱 **Responsive Design Patterns**

### **Mobile-First Breakpoints**
```css
/* apps/web/src/styles/responsive.css */
@media (max-width: 640px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### **Touch-Friendly Components**
```typescript
// Enhanced buttons for mobile
const mobileButtonStyles = {
  base: "min-h-[44px] min-w-[44px]", // WCAG touch target size
  spacing: "px-6 py-3", // Generous spacing
  text: "text-base", // Readable font size
};
```

---

## 🎨 **Animation & Interaction**

### **Micro-Interactions**
```css
/* apps/web/src/styles/animations.css */
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(1rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-slide-in {
  animation: slideInFromRight 0.3s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

/* Loading states */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### **Page Transitions**
```typescript
// apps/web/src/components/ui/page-transition.tsx
import { motion } from "framer-motion";

export function PageTransition({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 🌐 **Accessibility Features**

### **WCAG 2.1 AA Compliance**
```typescript
// apps/web/src/components/ui/accessible-button.tsx
interface AccessibleButtonProps extends ButtonProps {
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export function AccessibleButton({ children, ...props }: AccessibleButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "hover:scale-105 transition-transform",
        props.className
      )}
    >
      {children}
    </Button>
  );
}
```

### **Skip Links & Screen Reader Support**
```typescript
// apps/web/src/components/accessibility/SkipLinks.tsx
export function SkipLinks() {
  return (
    <nav className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-4 left-32 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2"
      >
        Skip to navigation
      </a>
    </nav>
  );
}
```

---

## 📊 **Data Visualization**

### **Tax Report Charts**
```typescript
// apps/web/src/components/charts/TaxReportChart.tsx
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TaxReportChart({ data }: { data: TaxData[] }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Tax Payment Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {/* Chart implementation with recharts/victory/d3 */}
          <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Chart visualization here</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🎯 **Performance Optimization**

### **Lazy Loading Strategy**
```typescript
// apps/web/src/components/lazy/index.ts
import { lazy } from "react";

export const LazyTaxCalculator = lazy(() =>
  import("../tax/TaxCalculator").then(module => ({
    default: module.TaxCalculator
  }))
);

export const LazyClientPortal = lazy(() =>
  import("../client/ClientPortal").then(module => ({
    default: module.ClientPortal
  }))
);
```

### **Image Optimization**
```typescript
// apps/web/src/components/ui/optimized-image.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      className="object-cover rounded-lg"
    />
  );
}
```

---

## 🔧 **Development Workflow**

### **Component Testing**
```typescript
// apps/web/src/components/tax/__tests__/TaxCalculator.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { TaxCalculator } from "../TaxCalculator";

describe("TaxCalculator", () => {
  it("calculates PAYE tax correctly", () => {
    render(<TaxCalculator />);

    const salaryInput = screen.getByLabelText("Gross Salary");
    fireEvent.change(salaryInput, { target: { value: "100000" } });

    const calculateButton = screen.getByRole("button", { name: /calculate/i });
    fireEvent.click(calculateButton);

    expect(screen.getByText(/net salary/i)).toBeInTheDocument();
  });
});
```

### **Storybook Integration**
```typescript
// apps/web/src/components/tax/TaxCalculator.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { TaxCalculator } from "./TaxCalculator";

const meta: Meta<typeof TaxCalculator> = {
  title: "Business/TaxCalculator",
  component: TaxCalculator,
  parameters: {
    docs: {
      description: {
        component: "GRA-compliant PAYE tax calculator for Guyana"
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof TaxCalculator>;

export const Default: Story = {};

export const WithHighSalary: Story = {
  args: {
    initialSalary: 150000
  }
};
```

---

This design system provides a comprehensive foundation for the GK-Nexus Suite, leveraging our existing shadcn/ui components while adding Guyana-specific enhancements and enterprise-grade features. The components are accessible, responsive, and optimized for both desktop tax preparation and mobile client interactions.