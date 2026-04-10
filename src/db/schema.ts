import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** One restaurant = one pin = one review (Qasim-only view). */
export const restaurants = sqliteTable("restaurants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine").notNull().default(""),
  price: text("price").notNull().default(""),
  whatIOrdered: text("what_i_ordered").notNull().default(""),
  distanceText: text("distance_text").notNull().default(""),
  rating: real("rating"),
  review: text("review").notNull().default(""),
  googleMapsUrl: text("google_maps_url"),
  websiteUrl: text("website_url"),
  menuUrl: text("menu_url"),
  lat: real("lat"),
  lng: real("lng"),
  geocodeSource: text("geocode_source"),
  geocodeLabel: text("geocode_label"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  communitySubmissions: many(communityScoreSubmissions),
}));

/** Superuser actions (and auth events). */
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  summary: text("summary"),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/**
 * Stub for future anonymous community scores (approval workflow).
 * Not used in UI yet.
 */
export const communityScoreSubmissions = sqliteTable(
  "community_score_submissions",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    comment: text("comment"),
    status: text("status").notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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
