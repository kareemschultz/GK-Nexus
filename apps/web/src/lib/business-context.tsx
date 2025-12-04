import { createContext, type ReactNode, useContext, useState } from "react";

export type BusinessUnit = "kaj" | "gcmc" | "all";

export interface BusinessInfo {
  id: BusinessUnit;
  name: string;
  shortName: string;
  description: string;
  color: string;
}

export const BUSINESSES: Record<Exclude<BusinessUnit, "all">, BusinessInfo> = {
  kaj: {
    id: "kaj",
    name: "KAJ Financial Services",
    shortName: "KAJ",
    description: "Tax preparation, accounting, payroll, and GRA filings",
    color: "blue",
  },
  gcmc: {
    id: "gcmc",
    name: "GCMC Consultancy",
    shortName: "GCMC",
    description:
      "Immigration, training, local content, and business consulting",
    color: "green",
  },
};

// Map sidebar routes to businesses
export const ROUTE_BUSINESS_MAP: Record<string, BusinessUnit> = {
  // KAJ Financial Services routes
  "/tax": "kaj",
  "/tax/paye": "kaj",
  "/tax/vat": "kaj",
  "/tax/nis": "kaj",
  "/tax/filing": "kaj",
  "/payroll": "kaj",
  "/payroll/employees": "kaj",
  "/payroll/run": "kaj",
  "/payroll/reports": "kaj",
  "/compliance": "kaj",
  "/compliance/gra-filing": "kaj",
  "/compliance/reports": "kaj",
  "/compliance/alerts": "kaj",
  "/invoices": "kaj",
  "/invoices/new": "kaj",
  "/invoices/payments": "kaj",

  // GCMC Consultancy routes
  "/immigration": "gcmc",
  "/training": "gcmc",
  "/local-content": "gcmc",
  "/expediting": "gcmc",
  "/property-management": "gcmc",
  "/partner-network": "gcmc",

  // Shared routes (show in both)
  "/dashboard": "all",
  "/clients": "all",
  "/clients/new": "all",
  "/clients/active": "all",
  "/documents": "all",
  "/documents/upload": "all",
  "/documents/templates": "all",
  "/time-tracking": "all",
  "/automation": "all",
  "/appointments": "all",
  "/users": "all",
  "/settings": "all",
  "/service-catalog": "all",
  "/portal": "all",
};

// Sidebar section titles to business mapping
export const SECTION_BUSINESS_MAP: Record<string, BusinessUnit> = {
  "Tax Services": "kaj",
  "Payroll Services": "kaj",
  "Compliance Hub": "kaj",
  "Invoice Management": "kaj",
  "Immigration Services": "gcmc",
  Training: "gcmc",
  "Local Content": "gcmc",
  "Expediting Services": "gcmc",
  "Property Management": "gcmc",
};

interface BusinessContextType {
  activeBusiness: BusinessUnit;
  setActiveBusiness: (business: BusinessUnit) => void;
  isRouteVisible: (routePath: string) => boolean;
  getBusinessForRoute: (routePath: string) => BusinessUnit;
  getActiveBusinessInfo: () => BusinessInfo | null;
}

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

const STORAGE_KEY = "gk-nexus-active-business";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [activeBusiness, setActiveBusinessState] = useState<BusinessUnit>(
    () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "kaj" || stored === "gcmc" || stored === "all") {
          return stored;
        }
      }
      return "all";
    }
  );

  const setActiveBusiness = (business: BusinessUnit) => {
    setActiveBusinessState(business);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, business);
    }
  };

  const getBusinessForRoute = (routePath: string): BusinessUnit => {
    // Check exact match first
    if (ROUTE_BUSINESS_MAP[routePath]) {
      return ROUTE_BUSINESS_MAP[routePath];
    }
    // Check if any key starts with the route
    for (const [key, value] of Object.entries(ROUTE_BUSINESS_MAP)) {
      if (routePath.startsWith(key) || key.startsWith(routePath)) {
        return value;
      }
    }
    return "all";
  };

  const isRouteVisible = (routePath: string): boolean => {
    if (activeBusiness === "all") return true;
    const routeBusiness = getBusinessForRoute(routePath);
    return routeBusiness === "all" || routeBusiness === activeBusiness;
  };

  const getActiveBusinessInfo = (): BusinessInfo | null => {
    if (activeBusiness === "all") return null;
    return BUSINESSES[activeBusiness];
  };

  return (
    <BusinessContext.Provider
      value={{
        activeBusiness,
        setActiveBusiness,
        isRouteVisible,
        getBusinessForRoute,
        getActiveBusinessInfo,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error(
      "useBusinessContext must be used within a BusinessProvider"
    );
  }
  return context;
}

// Helper hook for filtering data by business
export function useBusinessFilter<T extends { business?: string }>(
  items: T[]
): T[] {
  const { activeBusiness } = useBusinessContext();

  if (activeBusiness === "all") return items;

  return items.filter(
    (item) => !item.business || item.business === activeBusiness
  );
}
