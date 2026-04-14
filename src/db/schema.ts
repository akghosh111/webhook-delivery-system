import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex
} from "drizzle-orm/pg-core";



export const deliveryStatusEnum = pgEnum("delivery_status", [
  "PENDING",
  "SUCCESS",
  "FAILED"
]);



export const endpoints = pgTable("endpoints", {
  id: serial("id").primaryKey(),

  url: text("url").notNull(),

  secret: text("secret").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull()
});



export const events = pgTable("events", {
  id: serial("id").primaryKey(),

  type: text("type").notNull(),

  payload: jsonb("payload").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull()
});



export const deliveries = pgTable(
  "deliveries",
  {
    id: serial("id").primaryKey(),

    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    endpointId: integer("endpoint_id")
      .notNull()
      .references(() => endpoints.id, { onDelete: "cascade" }),

    status: deliveryStatusEnum("status")
      .default("PENDING")
      .notNull(),

    attemptCount: integer("attempt_count")
      .default(0)
      .notNull(),

    lastAttemptAt: timestamp("last_attempt_at"),

    responseCode: integer("response_code"),

    responseBody: text("response_body"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
  },
  (table) => {
    return {
      uniqueDelivery: uniqueIndex("event_endpoint_unique").on(
        table.eventId,
        table.endpointId
      )
    };
  }
);