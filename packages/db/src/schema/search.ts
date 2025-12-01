import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  // vector, // Requires pgvector extension - uncomment when available
} from "drizzle-orm/pg-core";

import { users } from "./users";

// Search entity types
export const searchEntityTypeEnum = pgEnum("search_entity_type", [
  "client",
  "document",
  "invoice",
  "appointment",
  "user",
  "task",
  "note",
  "compliance_item",
  "tax_calculation",
]);

// Search index table for full-text search
export const searchIndex = pgTable(
  "search_index",
  {
    id: text("id").primaryKey(),
    entityType: searchEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),

    // Searchable content
    title: text("title").notNull(),
    content: text("content").notNull(),
    tags: text("tags").array(), // Array of tags for categorization

    // Search metadata
    searchableText: text("searchable_text").notNull(), // Combined searchable content
    // contentVector: vector("content_vector", { dimensions: 384 }), // For semantic search - requires pgvector

    // Additional metadata for filtering and sorting
    metadata: jsonb("metadata"), // Additional searchable metadata

    // Access control
    visibility: text("visibility").default("private").notNull(), // "public", "private", "team"
    ownerId: text("owner_id").references(() => users.id),
    teamIds: text("team_ids").array(), // Array of team IDs with access

    // Content details
    fileType: text("file_type"), // For documents
    fileSize: text("file_size"), // In bytes
    language: text("language").default("en"), // Content language

    // Relevance and ranking
    relevanceScore: text("relevance_score").default("0"), // Base relevance score
    lastAccessedAt: timestamp("last_accessed_at"),
    accessCount: text("access_count").default("0"),

    // Status and lifecycle
    isIndexed: boolean("is_indexed").default(false).notNull(),
    indexedAt: timestamp("indexed_at"),
    lastModifiedAt: timestamp("last_modified_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("search_index_entity_idx").on(table.entityType, table.entityId),
    index("search_index_owner_idx").on(table.ownerId),
    index("search_index_visibility_idx").on(table.visibility),
    index("search_index_file_type_idx").on(table.fileType),
    index("search_index_tags_idx").on(table.tags),
    index("search_index_is_indexed_idx").on(table.isIndexed),
    index("search_index_last_modified_idx").on(table.lastModifiedAt),
    // Full-text search index - requires pg_trgm extension or use btree instead
    // index("search_index_searchable_text_idx").using("gin", table.searchableText), // Needs pg_trgm
  ]
);

// Saved searches for users
export const savedSearches = pgTable(
  "saved_searches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    // Search criteria
    query: text("query").notNull(),
    filters: jsonb("filters"), // Search filters as JSON
    sortBy: text("sort_by").default("relevance"),
    sortOrder: text("sort_order").default("desc"),

    // Search scope
    entityTypes: searchEntityTypeEnum("entity_types").array(),
    dateRange: jsonb("date_range"), // { from: "2024-01-01", to: "2024-12-31" }

    // Usage tracking
    lastUsedAt: timestamp("last_used_at"),
    useCount: text("use_count").default("0"),

    // Sharing and notifications
    isShared: boolean("is_shared").default(false).notNull(),
    sharedWith: text("shared_with").array(), // Array of user IDs
    enableAlerts: boolean("enable_alerts").default(false).notNull(),
    alertFrequency: text("alert_frequency").default("daily"), // "realtime", "daily", "weekly"

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("saved_searches_user_id_idx").on(table.userId),
    index("saved_searches_is_shared_idx").on(table.isShared),
    index("saved_searches_last_used_idx").on(table.lastUsedAt),
  ]
);

// Search history for analytics and suggestions
export const searchHistory = pgTable(
  "search_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id"), // For anonymous search tracking

    // Search details
    query: text("query").notNull(),
    filters: jsonb("filters"),
    entityTypes: searchEntityTypeEnum("entity_types").array(),

    // Results and interaction
    resultCount: text("result_count").default("0"),
    clickedResults: text("clicked_results").array(), // Array of clicked result IDs
    timeToFirstClick: text("time_to_first_click"), // Milliseconds
    searchDuration: text("search_duration"), // Milliseconds

    // Context
    source: text("source").default("web"), // "web", "mobile", "api"
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),

    // Search success metrics
    wasSuccessful: boolean("was_successful"), // Did user interact with results?
    refinementCount: text("refinement_count").default("0"), // How many times query was refined

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("search_history_user_id_idx").on(table.userId),
    index("search_history_query_idx").on(table.query),
    index("search_history_created_at_idx").on(table.createdAt),
    index("search_history_was_successful_idx").on(table.wasSuccessful),
  ]
);

// Search suggestions and autocomplete
export const searchSuggestions = pgTable(
  "search_suggestions",
  {
    id: text("id").primaryKey(),

    // Suggestion content
    term: text("term").notNull(),
    category: text("category"), // "client_name", "document_type", "tag", etc.
    displayText: text("display_text").notNull(),

    // Relevance and frequency
    frequency: text("frequency").default("1"), // How often this term is searched
    successRate: text("success_rate").default("0"), // Percentage of successful searches
    lastUsedAt: timestamp("last_used_at"),

    // Context and metadata
    entityType: searchEntityTypeEnum("entity_type"),
    metadata: jsonb("metadata"), // Additional context for the suggestion

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    isBlocked: boolean("is_blocked").default(false).notNull(), // For inappropriate terms

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("search_suggestions_term_idx").on(table.term),
    index("search_suggestions_category_idx").on(table.category),
    index("search_suggestions_frequency_idx").on(table.frequency),
    index("search_suggestions_is_active_idx").on(table.isActive),
    index("search_suggestions_entity_type_idx").on(table.entityType),
  ]
);

// Search analytics for insights
export const searchAnalytics = pgTable(
  "search_analytics",
  {
    id: text("id").primaryKey(),

    // Time period
    date: timestamp("date").notNull(),
    period: text("period").default("day").notNull(), // "hour", "day", "week", "month"

    // Aggregated metrics
    totalSearches: text("total_searches").default("0"),
    uniqueUsers: text("unique_users").default("0"),
    successfulSearches: text("successful_searches").default("0"),
    avgResponseTime: text("avg_response_time").default("0"), // Milliseconds
    avgResultCount: text("avg_result_count").default("0"),

    // Popular queries and entities
    topQueries: jsonb("top_queries"), // Array of { query, count }
    topEntityTypes: jsonb("top_entity_types"), // Array of { type, count }
    topFilters: jsonb("top_filters"), // Array of { filter, count }

    // Performance metrics
    slowQueries: jsonb("slow_queries"), // Queries taking > threshold time
    failedQueries: jsonb("failed_queries"), // Queries with errors

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("search_analytics_date_idx").on(table.date),
    index("search_analytics_period_idx").on(table.period),
  ]
);

// Relations
export const searchIndexRelations = relations(searchIndex, ({ one }) => ({
  owner: one(users, {
    fields: [searchIndex.ownerId],
    references: [users.id],
  }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));
