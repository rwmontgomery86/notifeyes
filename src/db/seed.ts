/**
 * NotifEyes seed data — V1 dev.
 *
 * Builds: 5 California practices, 20 ODs (mostly verified), 1 admin user.
 * Shifts are added in M2's seed update once those entities exist.
 *
 * All persons are fabricated. Marked `// SEED: realistic but fabricated` where invented.
 */

import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import {
  applications,
  bookings,
  contracts,
  optometrists,
  payouts,
  practices,
  shifts,
  threadParticipants,
  threads,
  users,
} from "@/db/schema";
import { computeShiftCost } from "@/lib/pricing";
import { BETA_AGREEMENT_VERSION } from "@/lib/beta-agreement";
import { buildContractBody, CONTRACT_TEMPLATE_VERSION } from "@/lib/contract";
import { formatUsd } from "@/lib/pricing";

// Stable seed for reproducible runs in dev
faker.seed(42);

// SEED: realistic but fabricated — Bay Area practices with real ZIPs
const PRACTICE_SEEDS = [
  {
    name: "Bayview Eye Care",
    addressLine: "1842 Geary Blvd",
    city: "San Francisco",
    state: "CA",
    zip: "94115",
    lng: -122.4444,
    lat: 37.7849,
    bio: "Independent optometry practice serving Western Addition. Two doctors, three lanes.",
    ehr: "RevolutionEHR",
  },
  {
    name: "Oakland Optometry Group",
    addressLine: "3200 Telegraph Ave",
    city: "Oakland",
    state: "CA",
    zip: "94609",
    lng: -122.2632,
    lat: 37.8268,
    bio: "Family-run since 2008. Pediatrics-friendly, full-scope primary care.",
    ehr: "Crystal Practice",
  },
  {
    name: "South Bay Vision Partners",
    addressLine: "1875 S Bascom Ave",
    city: "Campbell",
    state: "CA",
    zip: "95008",
    lng: -121.9325,
    lat: 37.2873,
    bio: "Three-chair practice in the West Valley. Heavy weekend volume.",
    ehr: "Eyefinity OfficeMate",
  },
  {
    name: "Berkeley Eyeworks",
    addressLine: "2150 Shattuck Ave",
    city: "Berkeley",
    state: "CA",
    zip: "94704",
    lng: -122.2680,
    lat: 37.8721,
    bio: "Boutique practice downtown. Specialty contact lenses + ortho-K.",
    ehr: "RevolutionEHR",
  },
  {
    name: "Palo Alto Family Eye Care",
    addressLine: "850 University Ave",
    city: "Palo Alto",
    state: "CA",
    zip: "94301",
    lng: -122.1497,
    lat: 37.4419,
    bio: "Multi-generational practice. Comprehensive medical optometry.",
    ehr: "RevolutionEHR",
  },
];

const OD_FIRSTS = [
  "Maya", "Jordan", "Priya", "Daniel", "Alex", "Sofia", "Marcus", "Hana",
  "Tomás", "Aisha", "Ben", "Kira", "Diego", "Naomi", "Sam", "Luca",
  "Yara", "Owen", "Elena", "Reza",
];
const OD_LASTS = [
  "Patel", "Nguyen", "Garcia", "Chen", "Kim", "Rodriguez", "Singh", "Tanaka",
  "Reyes", "Lewis", "Park", "Bhatt", "Cohen", "Lin", "Mendez", "Okafor",
  "Brennan", "Costa", "Yamada", "Aziz",
];

// Roughly Bay Area home centers
const OD_HOMES = [
  { lat: 37.7849, lng: -122.4194, city: "SF" },
  { lat: 37.8044, lng: -122.2712, city: "Oakland" },
  { lat: 37.4419, lng: -122.143,  city: "Palo Alto" },
  { lat: 37.3382, lng: -121.8863, city: "San Jose" },
  { lat: 37.8716, lng: -122.2727, city: "Berkeley" },
];

const SHARED_PASSWORD = "password123!"; // SEED: dev-only password for every seeded user

async function main() {
  console.log("[seed] starting…");

  // Clean slate (dev only — never run in prod)
  await db.execute(sql`
    TRUNCATE TABLE
      reviews,
      payouts,
      contracts,
      bookings,
      applications,
      shifts,
      messages,
      thread_participants,
      threads,
      notifications,
      push_subscriptions,
      favorite_ods,
      followed_practices,
      watch_zones,
      sessions,
      accounts,
      verification_tokens,
      users,
      optometrists,
      practices
    RESTART IDENTITY CASCADE;
  `);

  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 10);

  // === Practices + practice users ============================================
  const practiceIds: string[] = [];
  for (const p of PRACTICE_SEEDS) {
    const [row] = await db
      .insert(practices)
      .values({
        name: p.name,
        addressLine: p.addressLine,
        city: p.city,
        state: p.state,
        zip: p.zip,
        bio: p.bio,
        ehr: p.ehr,
        chairs: faker.number.int({ min: 2, max: 5 }),
        yearEstablished: faker.number.int({ min: 1985, max: 2018 }),
        services: ["Comprehensive eye exam", "Contact lens fitting", "Pediatric"],
        languages: ["English", "Spanish"],
        photos: [],
        businessLicenseVerified: true,
        paymentMethodVerified: true,
        ratingAvg: faker.number.float({ min: 4.2, max: 4.9, fractionDigits: 1 }),
        ratingCount: faker.number.int({ min: 8, max: 60 }),
        shiftsCompleted: faker.number.int({ min: 5, max: 45 }),
        onTimePayPct: faker.number.float({ min: 92, max: 100, fractionDigits: 1 }),
        avgFillTimeHrs: faker.number.float({ min: 2, max: 12, fractionDigits: 1 }),
        // PostGIS point — set via SQL since the column is geography(Point, 4326)
        location: sql`ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography`,
      })
      .returning({ id: practices.id });
    practiceIds.push(row.id);

    // Owner user — email opt-in defaults to true since the address is verified.
    await db.insert(users).values({
      email: `owner@${slugify(p.name)}.dev`,
      passwordHash,
      role: "practice_owner",
      practiceId: row.id,
      name: `Owner · ${p.name}`,
      emailVerifiedAt: sql`now()`,
      emailOptedIn: true,
      betaAgreementAcceptedAt: sql`now()`,
      betaAgreementVersion: BETA_AGREEMENT_VERSION,
    });
    // Scheduler user (subset)
    if (Math.random() > 0.4) {
      await db.insert(users).values({
        email: `scheduler@${slugify(p.name)}.dev`,
        passwordHash,
        role: "practice_scheduler",
        practiceId: row.id,
        name: `Scheduler · ${p.name}`,
        emailVerifiedAt: sql`now()`,
        emailOptedIn: true,
        betaAgreementAcceptedAt: sql`now()`,
        betaAgreementVersion: BETA_AGREEMENT_VERSION,
      });
    }
  }
  console.log(`[seed] inserted ${practiceIds.length} practices`);

  // === ODs ==================================================================
  const odIds: string[] = [];
  for (let i = 0; i < 20; i++) {
    const first = OD_FIRSTS[i % OD_FIRSTS.length]!;
    const last = OD_LASTS[i % OD_LASTS.length]!;
    const home = OD_HOMES[i % OD_HOMES.length]!;
    const verified = i < 16; // 4 left pending so the admin queue isn't empty

    const [row] = await db
      .insert(optometrists)
      .values({
        name: `Dr. ${first} ${last}, OD`,
        displayName: `Dr. ${first}`,
        bio: faker.lorem.sentence({ min: 8, max: 14 }),
        homeLocation: sql`ST_SetSRID(ST_MakePoint(${home.lng + faker.number.float({ min: -0.05, max: 0.05 })}, ${home.lat + faker.number.float({ min: -0.05, max: 0.05 })}), 4326)::geography`,
        travelRadiusMi: faker.helpers.arrayElement([15, 25, 40, 60]),
        licenseState: "CA",
        licenseNumber: `OPT${faker.number.int({ min: 10000, max: 99999 })}`,
        licenseExpiresAt: faker.date.future({ years: 2 }),
        verificationStatus: verified ? "verified" : "pending",
        verifiedAt: verified ? sql`now()` : null,
        ehrExperience: faker.helpers.arrayElements(
          ["RevolutionEHR", "Crystal Practice", "Eyefinity OfficeMate", "Compulink", "Practice Director"],
          { min: 1, max: 3 },
        ),
        specialties: faker.helpers.arrayElements(
          ["Pediatrics", "Specialty CL", "Ocular disease", "Dry eye", "Myopia control"],
          { min: 0, max: 3 },
        ),
        ratingAvg: verified ? faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }) : null,
        ratingCount: verified ? faker.number.int({ min: 0, max: 24 }) : 0,
        shiftsCompleted: verified ? faker.number.int({ min: 0, max: 30 }) : 0,
      })
      .returning({ id: optometrists.id });
    odIds.push(row.id);

    await db.insert(users).values({
      email: `${first.toLowerCase()}.${last.toLowerCase()}@notifeyes.dev`,
      passwordHash,
      role: "od",
      odId: row.id,
      name: `Dr. ${first} ${last}`,
      emailVerifiedAt: sql`now()`,
      emailOptedIn: true,
      betaAgreementAcceptedAt: sql`now()`,
      betaAgreementVersion: BETA_AGREEMENT_VERSION,
    });
  }
  console.log(`[seed] inserted ${odIds.length} ODs (16 verified, 4 pending)`);

  // === Admin ================================================================
  await db.insert(users).values({
    email: "admin@notifeyes.dev",
    passwordHash,
    role: "admin",
    name: "NotifEyes Admin",
    emailVerifiedAt: sql`now()`,
    emailOptedIn: true,
    betaAgreementAcceptedAt: sql`now()`,
    betaAgreementVersion: BETA_AGREEMENT_VERSION,
  });
  console.log(`[seed] inserted admin user`);

  // === Shifts ===============================================================
  // Distribution: ~10 posted (future), ~5 booked, ~5 completed (past),
  // ~5 cancelled, ~5 draft. Total ~30.
  const verifiedOdRows = await db
    .select({ id: optometrists.id, name: optometrists.name })
    .from(optometrists)
    .where(eq(optometrists.verificationStatus, "verified"));

  // Practice users for posted_by_user_id
  const practiceUsersByPracticeId = new Map<string, string>();
  for (const pid of practiceIds) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.practiceId, pid))
      .limit(1);
    if (u) practiceUsersByPracticeId.set(pid, u.id);
  }
  // OD users (so we can build threads on seeded bookings)
  const odUsersByOdId = new Map<string, string>();
  for (const od of verifiedOdRows) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.odId, od.id))
      .limit(1);
    if (u) odUsersByOdId.set(od.id, u.id);
  }

  const SHIFT_PLAN: { count: number; status: "posted" | "draft" | "booked" | "completed" | "cancelled" }[] = [
    { count: 10, status: "posted" },
    { count: 5, status: "booked" },
    { count: 5, status: "completed" },
    { count: 5, status: "cancelled" },
    { count: 5, status: "draft" },
  ];

  const seededShiftIds: string[] = [];
  let shiftIdx = 0;
  for (const bucket of SHIFT_PLAN) {
    for (let j = 0; j < bucket.count; j++) {
      const practiceId = practiceIds[shiftIdx % practiceIds.length]!;
      const postedByUserId = practiceUsersByPracticeId.get(practiceId)!;

      // future for posted/draft/booked, past for completed/cancelled
      const isFuture = bucket.status === "posted" || bucket.status === "draft" || bucket.status === "booked";
      const dayOffset = isFuture
        ? faker.number.int({ min: 1, max: 21 })
        : -faker.number.int({ min: 2, max: 45 });
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + dayOffset);
      startsAt.setHours(faker.helpers.arrayElement([8, 9, 10, 13]), 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + faker.helpers.arrayElement([4, 6, 8, 9]) * 3600_000);
      const rate = faker.helpers.arrayElement([95, 100, 110, 115, 120, 130]);

      const [s] = await db
        .insert(shifts)
        .values({
          practiceId,
          postedByUserId,
          startsAt,
          endsAt,
          lunchMinutes: 30,
          type: faker.helpers.arrayElement(["fill_in", "half_day", "weekend"]),
          rateCentsPerHour: rate * 100,
          servicesNeeded: faker.helpers.arrayElements(
            ["Comprehensive exams", "Contact lens fitting", "Pediatric", "Dry eye"],
            { min: 1, max: 3 },
          ),
          notesForOd:
            faker.helpers.arrayElement([
              "Two lanes, RevolutionEHR. Parking in back lot.",
              "Pediatric afternoon, expect ~12 patients. Friendly staff.",
              "Saturday coverage. Light schedule, mostly CL follow-ups.",
              null,
            ]),
          visibility: "public",
          status: bucket.status,
          postedAt: bucket.status === "draft" ? null : sql`now()`,
        })
        .returning({ id: shifts.id, practiceId: shifts.practiceId, totalRateCents: shifts.rateCentsPerHour });
      seededShiftIds.push(s.id);

      // === For booked / completed shifts: create application + booking + contract ===
      if (bucket.status === "booked" || bucket.status === "completed") {
        const od = faker.helpers.arrayElement(verifiedOdRows);
        const [app] = await db
          .insert(applications)
          .values({
            shiftId: s.id,
            odId: od.id,
            source: "apply",
            status: "accepted",
            message: "Excited to cover this — I'll be there 15 min early.",
          })
          .returning({ id: applications.id });

        // Lookup practice for contract body
        const [practiceRow] = await db
          .select({ name: practices.name })
          .from(practices)
          .where(eq(practices.id, practiceId))
          .limit(1);

        const cost = computeShiftCost({
          rateCentsPerHour: rate * 100,
          startsAt,
          endsAt,
          lunchMinutes: 30,
        });

        const [b] = await db
          .insert(bookings)
          .values({
            shiftId: s.id,
            odId: od.id,
            practiceId,
            applicationId: app.id,
            totalCents: cost.totalCents,
            platformFeeCents: cost.feeCents,
            status: bucket.status === "booked" ? "confirmed" : "completed",
            paymentStatus: "succeeded",
            paymentIntentId: `pi_stub_seed_${faker.string.alphanumeric(12)}`,
            checkInAt: bucket.status === "completed" ? new Date(startsAt.getTime() - 5 * 60_000) : null,
            checkOutAt: bucket.status === "completed" ? endsAt : null,
          })
          .returning({ id: bookings.id });

        const contractBody = buildContractBody({
          practiceName: practiceRow?.name ?? "Practice",
          odName: od.name,
          shiftStartsAt: startsAt,
          shiftEndsAt: endsAt,
          ratePerHour: formatUsd(rate * 100),
          wageAmount: formatUsd(cost.wageCents),
          matchFee: formatUsd(cost.feeCents),
        });

        const [c] = await db
          .insert(contracts)
          .values({
            bookingId: b.id,
            templateVersion: CONTRACT_TEMPLATE_VERSION,
            bodyText: contractBody,
            signedByPracticeAt: sql`now()`,
            signedByPracticeUserId: postedByUserId,
            signedByOdAt: sql`now()`,
            signedByOdUserId: odUsersByOdId.get(od.id),
          })
          .returning({ id: contracts.id });

        await db
          .update(bookings)
          .set({ contractId: c.id })
          .where(eq(bookings.id, b.id));

        await db
          .update(shifts)
          .set({ bookedApplicationId: app.id })
          .where(eq(shifts.id, s.id));

        // Payout row for completed bookings (mix of scheduled + sent)
        if (bucket.status === "completed") {
          const odPayoutCents = cost.totalCents - cost.feeCents;
          const isSent = Math.random() > 0.5;
          await db.insert(payouts).values({
            bookingId: b.id,
            odId: od.id,
            amountCents: odPayoutCents,
            status: isSent ? "sent" : "scheduled",
            scheduledFor: new Date(endsAt.getTime() + 3 * 86400_000),
            sentAt: isSent ? new Date(endsAt.getTime() + 3 * 86400_000) : null,
          });
        }

        // Thread for messaging
        const odUserId = odUsersByOdId.get(od.id);
        if (odUserId) {
          const [t] = await db
            .insert(threads)
            .values({
              contextBookingId: b.id,
              contextShiftId: s.id,
              lastMessageAt: sql`now()`,
            })
            .returning({ id: threads.id });
          await db.insert(threadParticipants).values([
            { threadId: t.id, userId: postedByUserId },
            { threadId: t.id, userId: odUserId },
          ]);
        }
      }

      // === For posted shifts: add 1-3 pending applications ===
      if (bucket.status === "posted") {
        const numApps = faker.number.int({ min: 0, max: 3 });
        const applicants = faker.helpers.arrayElements(verifiedOdRows, numApps);
        for (const od of applicants) {
          await db
            .insert(applications)
            .values({
              shiftId: s.id,
              odId: od.id,
              source: faker.helpers.arrayElement(["apply", "watch_alert"]),
              message: faker.helpers.arrayElement([
                "Available all day — confirmed.",
                "I'm 20 min from your location. Ready to cover.",
                null,
              ]),
              status: faker.helpers.arrayElement(["applied", "applied", "shortlisted"]),
            })
            .onConflictDoNothing();
        }
      }
      shiftIdx++;
    }
  }
  console.log(`[seed] inserted ${seededShiftIds.length} shifts (with bookings/applications)`);

  console.log("\n[seed] done.\n");
  console.log("Test credentials (password for all):", SHARED_PASSWORD);
  console.log("  practice owner: owner@bayview-eye-care.dev");
  console.log("  OD:             maya.patel@notifeyes.dev");
  console.log("  pending OD:     yara.brennan@notifeyes.dev");
  console.log("  admin:          admin@notifeyes.dev\n");

  await pool.end();
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  pool.end().finally(() => process.exit(1));
});
