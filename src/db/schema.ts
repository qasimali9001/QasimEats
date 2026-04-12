import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** One restaurant = one pin = one review (Qasim-only view). */
export const restaurants = pgTable("restaurants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine").notNull().default(""),
  price: text("price").notNull().default(""),
  whatIOrdered: text("what_i_ordered").notNull().default(""),
  distanceText: text("distance_text").notNull().default(""),
  rating: doublePrecision("rating"),
  review: text("review").notNull().default(""),
  googleMapsUrl: text("google_maps_url"),
  websiteUrl: text("website_url"),
  menuUrl: text("menu_url"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  geocodeSource: text("geocode_source"),
  geocodeLabel: text("geocode_label"),
  lunch: boolean("lunch").notNull().default(false),
  dinner: boolean("dinner").notNull().default(false),
  /** Calendar date of the visit / review entry (optional for legacy rows). */
  entryDate: date("entry_date", { mode: "string" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  communitySubmissions: many(communityScoreSubmissions),
}));

/** Superuser actions (and auth events). */
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  summary: text("summary"),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

/**
 * Stub for future anonymous community scores (approval workflow).
 * Not used in UI yet.
 */
export const communityScoreSubmissions = pgTable(
  "community_score_submissions",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    score: doublePrecision("score").notNull(),
    comment: text("comment"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  }
);

export const communityScoreSubmissionsRelations = relations(
  communityScoreSubmissions,
  ({ one }) => ({
    restaurant: one(restaurants, {
      fields: [communityScoreSubmissions.restaurantId],
      references: [restaurants.id],
    }),
  })
);
