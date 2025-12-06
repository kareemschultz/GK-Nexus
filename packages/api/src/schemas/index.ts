// Export all schemas and types from a central location

export * from "./clients";
export * from "./tax-calculations";
export * from "./users";

// Common utility schemas
import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const sortingSchema = z.object({
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const auditSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

export const responseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional(),
  }),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
      }),
    }),
    message: z.string().optional(),
  });

// Export types
export type Pagination = z.infer<typeof paginationSchema>;
export type Sorting = z.infer<typeof sortingSchema>;
export type Search = z.infer<typeof searchSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Audit = z.infer<typeof auditSchema>;
export type Response<T> = {
  success: boolean;
  data: T;
  message?: string;
};
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type PaginatedResponse<T> = {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
};
