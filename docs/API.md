# GK-Nexus API Reference

## Overview

GK-Nexus uses **oRPC** (OpenRPC) with a nested router pattern for type-safe API calls. The API is organized into domain-specific routers with a hierarchical structure.

## API Pattern

```typescript
// Pattern: client.{domain}.{resource}.{action}()

// Examples:
client.clients.list({ page: 1, limit: 20 })
client.clients.create({ name: "ABC Corp", email: "..." })
client.payroll.employees.list({ ... })
client.tax.filings.submitVat({ ... })
```

## Authentication

All protected routes require a valid session. The API uses Better-Auth for authentication.

```typescript
// Login
const session = await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
});

// Session is automatically included in subsequent API calls
```

## API Domains

### Clients

```typescript
// List clients with pagination and search
client.clients.list({
  page: 1,
  limit: 20,
  search: "acme",
  status: "active",
})

// Get single client
client.clients.getById({ id: "client-uuid" })

// Create client
client.clients.create({
  name: "ACME Corp",
  email: "contact@acme.com",
  type: "business",
  taxId: "TIN123456",
})

// Update client
client.clients.update({
  id: "client-uuid",
  name: "ACME Corporation",
})

// Delete client
client.clients.delete({ id: "client-uuid" })
```

### Appointments

```typescript
client.appointments.list({ startDate, endDate })
client.appointments.getById({ id })
client.appointments.create({ clientId, title, scheduledAt, duration })
client.appointments.update({ id, ...fields })
client.appointments.cancel({ id })
```

### Documents

```typescript
client.documents.list({ clientId, category })
client.documents.upload({ file, clientId, category })
client.documents.search({ query })
client.documents.requirements.list({ clientId, serviceType })
```

### Invoices

```typescript
client.invoices.list({ clientId, status })
client.invoices.getById({ id })
client.invoices.create({ clientId, items, dueDate })
client.invoices.update({ id, ...fields })
client.invoices.markPaid({ id, paymentMethod })
```

### Tax

```typescript
// Calculations
client.tax.calculate.paye({ grossSalary, allowances })
client.tax.calculate.nis({ grossSalary })
client.tax.calculate.vat({ amount, isInclusive })

// Filings
client.tax.filings.list({ year, type })
client.tax.filings.submitVat({ period, sales, purchases })
client.tax.filings.submitPaye({ period, employees })
```

### Payroll

```typescript
// Employees
client.payroll.employees.list({ department, status })
client.payroll.employees.create({ firstName, lastName, email, salary })
client.payroll.employees.update({ id, ...fields })
client.payroll.employees.delete({ id })

// Payroll runs
client.payroll.runs.create({ month, year })
client.payroll.runs.process({ id })
client.payroll.runs.approve({ id })
```

### Users & RBAC

```typescript
client.users.list({ role })
client.users.invite({ email, role })
client.rbac.roles.list()
client.rbac.permissions.list()
```

### Dashboard

```typescript
client.dashboard.overview({ timeRange: "30d" })
client.dashboard.stats()
```

### Service Catalog

Note: Service catalog uses flat procedure names internally.

```typescript
client.serviceCatalog.servicesList({ category })
client.serviceCatalog.projectsList({ status })
client.serviceCatalog.servicesStats()
```

## Frontend Integration

### Using useQuery

```typescript
import { useQuery } from "@tanstack/react-query";

const ClientsList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients", { search, page }],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.list({ page, limit: 20, search });
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <ClientTable data={data.data.items} />;
};
```

### Using useMutation

```typescript
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/utils/orpc";

const CreateClient = () => {
  const mutation = useMutation({
    mutationFn: async (data: CreateClientInput) => {
      const { client } = await import("@/utils/orpc");
      return client.clients.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate(formData);
    }}>
      {/* form fields */}
    </form>
  );
};
```

## Error Handling

The API returns structured errors using ORPCError:

```typescript
import { ORPCError } from "@orpc/server";

// Common error codes
throw new ORPCError("NOT_FOUND", { message: "Client not found" });
throw new ORPCError("FORBIDDEN", { message: "Insufficient permissions" });
throw new ORPCError("BAD_REQUEST", { message: "Invalid input data" });
throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
```

## Permissions

Protected routes use the `requirePermission` middleware:

```typescript
// API procedure with permission check
export const clientsCreate = protectedProcedure
  .use(requirePermission("clients.create"))
  .input(createClientSchema)
  .handler(async ({ input, context }) => {
    // Implementation
  });
```

### Available Permissions

| Domain | Permissions |
|--------|------------|
| clients | `clients.read`, `clients.create`, `clients.update`, `clients.delete` |
| documents | `documents.read`, `documents.upload`, `documents.delete` |
| invoices | `invoices.read`, `invoices.create`, `invoices.update` |
| tax | `tax.read`, `tax.calculate`, `tax.file` |
| payroll | `payroll.read`, `payroll.create`, `payroll.approve` |
| users | `users.read`, `users.invite`, `users.manage` |
| admin | `admin.full` |

## Response Format

All API responses follow a consistent format:

```typescript
// Success response
{
  success: true,
  data: {
    items: [...],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8
    }
  }
}

// Error response
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Resource not found"
  }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Standard endpoints**: 100 requests per minute
- **Authentication**: 10 requests per minute
- **File uploads**: 20 requests per minute

---

**GK-Nexus Suite** - Created by **Kareem Schultz** at [Karetech Solutions](https://karetech.gy)
