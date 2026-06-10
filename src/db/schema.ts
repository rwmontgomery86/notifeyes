import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// PostGIS geometry / geography column. Drizzle has no built-in for these,
// so we define a custom type that round-trips as raw SQL.
const geography = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geography(Geometry, 4326)";
  },
});

const point = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

// =========================================================================
// Enums  (mirroring §3 / §4 of the brief)
// =========================================================================

export const userRoleEnum = pgEnum("user_role", [
  "practice_owner",
  "practice_scheduler",
  "od",
  "admin",
]);

export const shiftTypeEnum = pgEnum("shift_type", [
  "fill_in",
  "half_day",
  "weekend",
  "recurring",
  "permanent",
]);

export const shiftStatusEnum = pgEnum("shift_status", [
  "draft",
  "posted",
  "booked",
  "completed",
  "cancelled",
]);

export const shiftVisibilityEnum = pgEnum("shift_visibility", [
  "public",
  "favorites",
  "invite_only",
]);

export const applicationSourceEnum = pgEnum("application_source", [
  "apply",
  "invite",
  "watch_alert",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "shortlisted",
  "offered",
  "accepted",
  "declined",
  "withdrawn",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "scheduled",
  "sent",
  "failed",
]);

export const watchZoneShapeEnum = pgEnum("watch_zone_shape", [
  "circle",
  "polygon",
]);

export const reviewAuthorEnum = pgEnum("review_author", ["practice", "od"]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);

// =========================================================================
// Users  (auth identities — bridges to Practice or OD profile)
// =========================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phone: varchar("phone", { length: 32 }),
    smsOptedIn: boolean("sms_opted_in").default(false).notNull(),
    emailOptedIn: boolean("email_opted_in").default(false).notNull(),
    marketingOptedIn: boolean("marketing_opted_in").default(false).notNull(),
    // Opt-in for "concierge" extras (morning-of reminders w/ address, .ics
    // calendar invites) on top of the default key-moment alerts. Off by default.
    conciergeOptedIn: boolean("concierge_opted_in").default(false).notNull(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull(),
    practiceId: uuid("practice_id"),
    odId: uuid("od_id"),
    name: varchar("name", { length: 200 }),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

// Auth.js adapter tables (sessions, accounts, verification tokens)
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// =========================================================================
// Practices
// =========================================================================

export const practices = pgTable("practices", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  dba: varchar("dba", { length: 200 }),
  bio: text("bio"),
  yearEstablished: integer("year_established"),
  chairs: integer("chairs"),
  ehr: varchar("ehr", { length: 80 }),
  services: jsonb("services").$type<string[]>().default([]).notNull(),
  languages: jsonb("languages").$type<string[]>().default([]).notNull(),
  photos: jsonb("photos").$type<string[]>().default([]).notNull(),
  // Address (flattened — kept simple for V1)
  addressLine: varchar("address_line", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zip: varchar("zip", { length: 10 }),
  // PostGIS point — stored as geography for distance math
  location: point("location"),
  // Verification flags (single-bit for now; expand to status enums in V2)
  businessLicenseVerified: boolean("business_license_verified").default(false).notNull(),
  paymentMethodVerified: boolean("payment_method_verified").default(false).notNull(),
  // Stripe card-on-file (A3, fee-only model). The practice saves a card once
  // (SetupIntent, off_session); every booking then authorizes the $10 match-fee
  // hold off-session against this customer + payment method. Both null until the
  // first card is saved; `paymentMethodVerified` flips true alongside.
  stripeCustomerId: text("stripe_customer_id"),
  defaultPaymentMethodId: text("default_payment_method_id"),
  ratingAvg: real("rating_avg"),
  ratingCount: integer("rating_count").default(0).notNull(),
  // Stats — mutable counters (denormalized for the practice profile)
  shiftsCompleted: integer("shifts_completed").default(0).notNull(),
  cancellationCount: integer("cancellation_count").default(0).notNull(),
  onTimePayPct: real("on_time_pay_pct"),
  avgFillTimeHrs: real("avg_fill_time_hrs"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// =========================================================================
// Optometrists (ODs)
// =========================================================================

export const optometrists = pgTable(
  "optometrists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    displayName: varchar("display_name", { length: 200 }),
    headshotUrl: text("headshot_url"),
    bio: text("bio"),
    // Home location for distance display
    homeLocation: point("home_location"),
    travelRadiusMi: integer("travel_radius_mi").default(25).notNull(),
    // License
    licenseState: varchar("license_state", { length: 2 }),
    licenseNumber: varchar("license_number", { length: 80 }),
    licenseExpiresAt: timestamp("license_expires_at", { withTimezone: true }),
    licenseDocUrl: text("license_doc_url"),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedByUserId: uuid("verified_by_user_id"),
    verificationNotes: text("verification_notes"),
    // Credentials (presence indicates the doc was uploaded; verification is separate)
    deaUrl: text("dea_url"),
    malpracticeUrl: text("malpractice_url"),
    cprUrl: text("cpr_url"),
    npiNumber: varchar("npi_number", { length: 20 }),
    idVerifiedAt: timestamp("id_verified_at", { withTimezone: true }),
    ehrExperience: jsonb("ehr_experience").$type<string[]>().default([]).notNull(),
    specialties: jsonb("specialties").$type<string[]>().default([]).notNull(),
    ratingAvg: real("rating_avg"),
    ratingCount: integer("rating_count").default(0).notNull(),
    shiftsCompleted: integer("shifts_completed").default(0).notNull(),
    cancellationCount: integer("cancellation_count").default(0).notNull(),
    noShowCount: integer("no_show_count").default(0).notNull(),
    payoutMethod: jsonb("payout_method").$type<{
      kind: "manual_ach";
      bankLast4?: string;
    } | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ods_verification_idx").on(t.verificationStatus)],
);

// =========================================================================
// Watch zones  (the differentiator)
// =========================================================================

export const watchZones = pgTable(
  "watch_zones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    odId: uuid("od_id")
      .notNull()
      .references(() => optometrists.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    shape: watchZoneShapeEnum("shape").notNull(),
    // For circle: stored as a polygon approximation OR keep raw center + radius.
    // We persist the actual queryable geometry here. The original circle params
    // are kept in `geometryMeta` so we can re-render the UI.
    geometry: geography("geometry").notNull(),
    geometryMeta: jsonb("geometry_meta").$type<
      | { kind: "circle"; centerLat: number; centerLng: number; radiusMeters: number }
      | { kind: "polygon"; points: { lat: number; lng: number }[] }
    >().notNull(),
    daysOfWeek: jsonb("days_of_week").$type<number[]>().default([0, 1, 2, 3, 4, 5, 6]).notNull(),
    timeStart: varchar("time_start", { length: 5 }), // "HH:MM"
    timeEnd: varchar("time_end", { length: 5 }),
    minRateCents: integer("min_rate_cents").default(0).notNull(),
    shiftTypes: jsonb("shift_types").$type<string[]>().default(["fill_in", "half_day", "weekend"]).notNull(),
    notifyChannels: jsonb("notify_channels").$type<("push" | "email" | "sms")[]>()
      .default(["push", "email"])
      .notNull(),
    paused: boolean("paused").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("watch_zones_od_idx").on(t.odId),
    // Spatial GIST index — created in a manual migration since drizzle-kit
    // doesn't generate GIST syntax. See migrations/0001_spatial_indexes.sql.
  ],
);

// =========================================================================
// Shifts
// =========================================================================

export const shifts = pgTable(
  "shifts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    postedByUserId: uuid("posted_by_user_id")
      .notNull()
      .references(() => users.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    lunchMinutes: integer("lunch_minutes").default(30).notNull(),
    type: shiftTypeEnum("type").notNull(),
    rateCentsPerHour: integer("rate_cents_per_hour").notNull(),
    bumpRateCentsPerHour: integer("bump_rate_cents_per_hour"),
    bumpRadiusMeters: integer("bump_radius_meters"),
    bumpedAt: timestamp("bumped_at", { withTimezone: true }),
    servicesNeeded: jsonb("services_needed").$type<string[]>().default([]).notNull(),
    notesForOd: text("notes_for_od"),
    visibility: shiftVisibilityEnum("visibility").default("public").notNull(),
    status: shiftStatusEnum("status").default("draft").notNull(),
    urgent: boolean("urgent").default(false).notNull(),
    bookedApplicationId: uuid("booked_application_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
  },
  (t) => [
    index("shifts_status_idx").on(t.status),
    index("shifts_starts_idx").on(t.startsAt),
    index("shifts_practice_idx").on(t.practiceId),
  ],
);

// =========================================================================
// Applications
// =========================================================================

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    odId: uuid("od_id")
      .notNull()
      .references(() => optometrists.id, { onDelete: "cascade" }),
    source: applicationSourceEnum("source").notNull(),
    message: text("message"),
    status: applicationStatusEnum("status").default("applied").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("applications_shift_od_idx").on(t.shiftId, t.odId),
    index("applications_status_idx").on(t.status),
  ],
);

// =========================================================================
// Bookings
// =========================================================================

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shifts.id),
    odId: uuid("od_id")
      .notNull()
      .references(() => optometrists.id),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    contractId: uuid("contract_id"),
    totalCents: integer("total_cents").notNull(),
    platformFeeCents: integer("platform_fee_cents").notNull(),
    status: bookingStatusEnum("status").default("confirmed").notNull(),
    cancelledByUserId: uuid("cancelled_by_user_id"),
    cancellationReason: text("cancellation_reason"),
    cancellationFeeCents: integer("cancellation_fee_cents"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    checkInAt: timestamp("check_in_at", { withTimezone: true }),
    checkOutAt: timestamp("check_out_at", { withTimezone: true }),
    // Fee-only model: the practice confirms the OD showed up, which captures the
    // match fee. Replaces OD check-in/out as the attendance signal.
    attendanceConfirmedAt: timestamp("attendance_confirmed_at", { withTimezone: true }),
    attendanceConfirmedByUserId: uuid("attendance_confirmed_by_user_id"),
    paymentIntentId: text("payment_intent_id"),
    paymentStatus: varchar("payment_status", { length: 40 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("bookings_shift_idx").on(t.shiftId),
    index("bookings_status_idx").on(t.status),
  ],
);

// =========================================================================
// Contracts
// =========================================================================

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  templateVersion: varchar("template_version", { length: 20 }).notNull(),
  bodyText: text("body_text").notNull(), // click-through agreement body, frozen at booking time
  signedByPracticeAt: timestamp("signed_by_practice_at", { withTimezone: true }),
  signedByPracticeUserId: uuid("signed_by_practice_user_id"),
  signedByOdAt: timestamp("signed_by_od_at", { withTimezone: true }),
  signedByOdUserId: uuid("signed_by_od_user_id"),
  pdfUrl: text("pdf_url"), // V2 — DocuSign or generated PDF
});

// =========================================================================
// Payouts
// =========================================================================

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    odId: uuid("od_id")
      .notNull()
      .references(() => optometrists.id),
    amountCents: integer("amount_cents").notNull(),
    status: payoutStatusEnum("status").default("scheduled").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    stripeTransferId: text("stripe_transfer_id"),
    markedSentByUserId: uuid("marked_sent_by_user_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payouts_status_idx").on(t.status),
    index("payouts_od_idx").on(t.odId),
  ],
);

// =========================================================================
// Reviews
// =========================================================================

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    authorRole: reviewAuthorEnum("author_role").notNull(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id),
    ratingOverall: integer("rating_overall").notNull(),
    ratingSpecifics: jsonb("rating_specifics").$type<Record<string, number>>().default({}).notNull(),
    publicComment: text("public_comment"),
    privateFeedback: text("private_feedback"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("reviews_booking_author_idx").on(t.bookingId, t.authorRole),
    index("reviews_published_idx").on(t.publishedAt),
  ],
);

// =========================================================================
// Messaging
// =========================================================================

export const threads = pgTable("threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  contextBookingId: uuid("context_booking_id").references(() => bookings.id, {
    onDelete: "cascade",
  }),
  contextShiftId: uuid("context_shift_id").references(() => shifts.id, {
    onDelete: "set null",
  }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const threadParticipants = pgTable(
  "thread_participants",
  {
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unreadCount: integer("unread_count").default(0).notNull(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.threadId, t.userId] })],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id),
    body: text("body").notNull(),
    attachments: jsonb("attachments").$type<{ url: string; name: string; size: number }[]>()
      .default([])
      .notNull(),
    systemKind: varchar("system_kind", { length: 40 }), // null = user-authored
    systemPayload: jsonb("system_payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_thread_idx").on(t.threadId, t.createdAt)],
);

// =========================================================================
// Notifications
// =========================================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 40 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    channelsSent: jsonb("channels_sent").$type<string[]>().default([]).notNull(),
    actionUrl: text("action_url"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_unread_idx").on(t.userId, t.readAt),
    index("notifications_created_idx").on(t.createdAt),
  ],
);

// Push subscriptions (Web Push) — one OD can have N devices
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("push_subs_endpoint_idx").on(t.endpoint)],
);

// =========================================================================
// Favorites / follows
// =========================================================================

export const favoriteOds = pgTable(
  "favorite_ods",
  {
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    odId: uuid("od_id")
      .notNull()
      .references(() => optometrists.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.practiceId, t.odId] })],
);

export const followedPractices = pgTable(
  "followed_practices",
  {
    odId: uuid("od_id")
      .notNull()
      .references(() => optometrists.id, { onDelete: "cascade" }),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.odId, t.practiceId] })],
);

export const odPracticeBlocks = pgTable(
  "od_practice_blocks",
  {
    odId: uuid("od_id")
      .notNull()
      .references(() => optometrists.id, { onDelete: "cascade" }),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    blockedAt: timestamp("blocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.odId, t.practiceId] })],
);

// Re-export the helper so other code can write geography literals if needed.
export { sql };
