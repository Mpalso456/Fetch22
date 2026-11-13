/**
 * Core CRM data model, shared by every specialty pack.
 *
 * Every table carries organizationId so the model is multi-tenant (and
 * DSO-ready) from day one. Referrals are owned here — not in the PMS — so the
 * referral CRM works even when PMS access is read-only, delayed or CSV-only.
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const specialtyEnum = pgEnum('specialty', [
  'general',
  'endodontics',
  'oral_surgery',
  'periodontics',
  'orthodontics',
  'pediatric',
  'prosthodontics',
  'orofacial_pain',
  'oral_medicine',
  'dental_anesthesiology',
]);

export const referralStatusEnum = pgEnum('referral_status', [
  'received',
  'contacted',
  'scheduled',
  'seen',
  'treatment_complete',
  'report_sent',
  'closed',
  'lost',
]);

export const referralSourceEnum = pgEnum('referral_source', ['portal', 'phone', 'fax', 'email', 'pms_import']);
export const urgencyEnum = pgEnum('urgency', ['routine', 'urgent', 'emergency']);
export const reportChannelEnum = pgEnum('report_channel', ['email', 'fax', 'portal', 'mail']);
export const outreachTypeEnum = pgEnum('outreach_type', [
  'office_visit',
  'lunch_and_learn',
  'ce_event',
  'gift',
  'call',
  'email',
  'study_club',
]);
export const channelEnum = pgEnum('channel', ['sms', 'email', 'voice']);
export const messagePurposeEnum = pgEnum('message_purpose', ['appointment', 'care_instructions', 'billing', 'marketing']);
export const consentStatusEnum = pgEnum('consent_status', ['granted', 'revoked']);

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const orgId = () =>
  uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' });

export const organizations = pgTable('organizations', {
  id: id(),
  name: text('name').notNull(),
  /** Public slug used by the referral portal: /refer/<slug> */
  slug: text('slug').notNull().unique(),
  specialty: specialtyEnum('specialty').notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),
  createdAt: createdAt(),
});

export const locations = pgTable('locations', {
  id: id(),
  organizationId: orgId(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  createdAt: createdAt(),
});

export const providers = pgTable('providers', {
  id: id(),
  organizationId: orgId(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  role: text('role').notNull().default('doctor'),
  createdAt: createdAt(),
});

/** An outside practice that sends patients (usually a general dentist's office). */
export const referringPractices = pgTable(
  'referring_practices',
  {
    id: id(),
    organizationId: orgId(),
    name: text('name').notNull(),
    phone: text('phone'),
    fax: text('fax'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    createdAt: createdAt(),
  },
  (t) => [index('referring_practices_org_idx').on(t.organizationId)],
);

/** An individual referring clinician — the "customer" in a referral-driven specialty. */
export const referringProviders = pgTable(
  'referring_providers',
  {
    id: id(),
    organizationId: orgId(),
    practiceId: uuid('practice_id').references(() => referringPractices.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    credential: text('credential').notNull().default('DDS'),
    specialty: specialtyEnum('specialty').notNull().default('general'),
    email: text('email'),
    phone: text('phone'),
    preferredReportChannel: reportChannelEnum('preferred_report_channel').notNull().default('email'),
    /** Staff member who owns the relationship (liaison / doctor). */
    relationshipOwner: text('relationship_owner'),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  (t) => [
    index('referring_providers_org_idx').on(t.organizationId),
    uniqueIndex('referring_providers_org_email_uq').on(t.organizationId, t.email),
  ],
);

export const patients = pgTable(
  'patients',
  {
    id: id(),
    organizationId: orgId(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    dateOfBirth: date('date_of_birth'),
    phone: text('phone'),
    email: text('email'),
    /** ID of this patient in the practice's PMS, once matched. */
    pmsPatientId: text('pms_patient_id'),
    createdAt: createdAt(),
  },
  (t) => [index('patients_org_idx').on(t.organizationId)],
);

/** Guardians / responsible parties (pediatric, special-needs, ortho responsible party). */
export const guardians = pgTable('guardians', {
  id: id(),
  organizationId: orgId(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  phone: text('phone'),
  email: text('email'),
  isFinanciallyResponsible: boolean('is_financially_responsible').notNull().default(false),
  mayReceiveMessages: boolean('may_receive_messages').notNull().default(true),
  createdAt: createdAt(),
});

export const referrals = pgTable(
  'referrals',
  {
    id: id(),
    organizationId: orgId(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict' }),
    referringProviderId: uuid('referring_provider_id').references(() => referringProviders.id, {
      onDelete: 'set null',
    }),
    locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
    specialty: specialtyEnum('specialty').notNull(),
    /** Key into the specialty pack's referral reasons. */
    reason: text('reason').notNull(),
    teeth: text('teeth'),
    clinicalNotes: text('clinical_notes'),
    urgency: urgencyEnum('urgency').notNull().default('routine'),
    source: referralSourceEnum('source').notNull(),
    status: referralStatusEnum('status').notNull().default('received'),
    estimatedValueCents: integer('estimated_value_cents'),
    lostReason: text('lost_reason'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    contactedAt: timestamp('contacted_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    seenAt: timestamp('seen_at', { withTimezone: true }),
    treatmentCompletedAt: timestamp('treatment_completed_at', { withTimezone: true }),
    reportSentAt: timestamp('report_sent_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('referrals_org_status_idx').on(t.organizationId, t.status),
    index('referrals_referrer_idx').on(t.referringProviderId, t.receivedAt),
  ],
);

/** Append-only audit trail of referral status changes. */
export const referralEvents = pgTable(
  'referral_events',
  {
    id: id(),
    organizationId: orgId(),
    referralId: uuid('referral_id')
      .notNull()
      .references(() => referrals.id, { onDelete: 'cascade' }),
    fromStatus: referralStatusEnum('from_status'),
    toStatus: referralStatusEnum('to_status').notNull(),
    note: text('note'),
    actor: text('actor'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('referral_events_referral_idx').on(t.referralId, t.at)],
);

/** Liaison / relationship-building activity with referring offices. */
export const outreachActivities = pgTable(
  'outreach_activities',
  {
    id: id(),
    organizationId: orgId(),
    referringProviderId: uuid('referring_provider_id').references(() => referringProviders.id, {
      onDelete: 'cascade',
    }),
    practiceId: uuid('practice_id').references(() => referringPractices.id, { onDelete: 'cascade' }),
    type: outreachTypeEnum('type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    owner: text('owner'),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  (t) => [index('outreach_referrer_idx').on(t.referringProviderId, t.occurredAt)],
);

/**
 * Consent ledger: one row per grant/revocation, per channel and purpose.
 * The latest row for (patient, channel, purpose) wins. Never updated in place.
 */
export const consentRecords = pgTable(
  'consent_records',
  {
    id: id(),
    organizationId: orgId(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    channel: channelEnum('channel').notNull(),
    purpose: messagePurposeEnum('purpose').notNull(),
    status: consentStatusEnum('status').notNull(),
    /** Where consent/revocation came from: "referral_portal", "sms_reply:STOP", "front_desk"... */
    source: text('source').notNull(),
    /** Written consent (required for marketing under TCPA). */
    isWritten: boolean('is_written').notNull().default(false),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('consent_patient_idx').on(t.patientId, t.channel, t.purpose, t.recordedAt)],
);

// ---------------------------------------------------------------------------
// Relations (for drizzle's relational query API)
// ---------------------------------------------------------------------------

export const referringPracticesRelations = relations(referringPractices, ({ many }) => ({
  providers: many(referringProviders),
}));

export const referringProvidersRelations = relations(referringProviders, ({ one, many }) => ({
  practice: one(referringPractices, {
    fields: [referringProviders.practiceId],
    references: [referringPractices.id],
  }),
  referrals: many(referrals),
  outreach: many(outreachActivities),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  referrals: many(referrals),
  guardians: many(guardians),
  consents: many(consentRecords),
}));

export const guardiansRelations = relations(guardians, ({ one }) => ({
  patient: one(patients, { fields: [guardians.patientId], references: [patients.id] }),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  patient: one(patients, { fields: [referrals.patientId], references: [patients.id] }),
  referringProvider: one(referringProviders, {
    fields: [referrals.referringProviderId],
    references: [referringProviders.id],
  }),
  events: many(referralEvents),
}));

export const referralEventsRelations = relations(referralEvents, ({ one }) => ({
  referral: one(referrals, { fields: [referralEvents.referralId], references: [referrals.id] }),
}));

export const outreachActivitiesRelations = relations(outreachActivities, ({ one }) => ({
  referringProvider: one(referringProviders, {
    fields: [outreachActivities.referringProviderId],
    references: [referringProviders.id],
  }),
}));

export const consentRecordsRelations = relations(consentRecords, ({ one }) => ({
  patient: one(patients, { fields: [consentRecords.patientId], references: [patients.id] }),
}));

export type Specialty = (typeof specialtyEnum.enumValues)[number];
export type ReferralStatus = (typeof referralStatusEnum.enumValues)[number];
export type Channel = (typeof channelEnum.enumValues)[number];
export type MessagePurpose = (typeof messagePurposeEnum.enumValues)[number];
export type OutreachType = (typeof outreachTypeEnum.enumValues)[number];
