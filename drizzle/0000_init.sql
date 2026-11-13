CREATE TYPE "public"."channel" AS ENUM('sms', 'email', 'voice');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('granted', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."message_purpose" AS ENUM('appointment', 'care_instructions', 'billing', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."outreach_type" AS ENUM('office_visit', 'lunch_and_learn', 'ce_event', 'gift', 'call', 'email', 'study_club');--> statement-breakpoint
CREATE TYPE "public"."referral_source" AS ENUM('portal', 'phone', 'fax', 'email', 'pms_import');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('received', 'contacted', 'scheduled', 'seen', 'treatment_complete', 'report_sent', 'closed', 'lost');--> statement-breakpoint
CREATE TYPE "public"."report_channel" AS ENUM('email', 'fax', 'portal', 'mail');--> statement-breakpoint
CREATE TYPE "public"."specialty" AS ENUM('general', 'endodontics', 'oral_surgery', 'periodontics', 'orthodontics', 'pediatric', 'prosthodontics', 'orofacial_pain', 'oral_medicine', 'dental_anesthesiology');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('routine', 'urgent', 'emergency');--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"purpose" "message_purpose" NOT NULL,
	"status" "consent_status" NOT NULL,
	"source" text NOT NULL,
	"is_written" boolean DEFAULT false NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone" text,
	"email" text,
	"is_financially_responsible" boolean DEFAULT false NOT NULL,
	"may_receive_messages" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"specialty" "specialty" NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "outreach_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"referring_provider_id" uuid,
	"practice_id" uuid,
	"type" "outreach_type" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"owner" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" date,
	"phone" text,
	"email" text,
	"pms_patient_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid,
	"name" text NOT NULL,
	"role" text DEFAULT 'doctor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"referral_id" uuid NOT NULL,
	"from_status" "referral_status",
	"to_status" "referral_status" NOT NULL,
	"note" text,
	"actor" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"referring_provider_id" uuid,
	"location_id" uuid,
	"specialty" "specialty" NOT NULL,
	"reason" text NOT NULL,
	"teeth" text,
	"clinical_notes" text,
	"urgency" "urgency" DEFAULT 'routine' NOT NULL,
	"source" "referral_source" NOT NULL,
	"status" "referral_status" DEFAULT 'received' NOT NULL,
	"estimated_value_cents" integer,
	"lost_reason" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"contacted_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"seen_at" timestamp with time zone,
	"treatment_completed_at" timestamp with time zone,
	"report_sent_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referring_practices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"fax" text,
	"address" text,
	"city" text,
	"state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referring_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"practice_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"credential" text DEFAULT 'DDS' NOT NULL,
	"specialty" "specialty" DEFAULT 'general' NOT NULL,
	"email" text,
	"phone" text,
	"preferred_report_channel" "report_channel" DEFAULT 'email' NOT NULL,
	"relationship_owner" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_referring_provider_id_referring_providers_id_fk" FOREIGN KEY ("referring_provider_id") REFERENCES "public"."referring_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_practice_id_referring_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."referring_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referring_provider_id_referring_providers_id_fk" FOREIGN KEY ("referring_provider_id") REFERENCES "public"."referring_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referring_practices" ADD CONSTRAINT "referring_practices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referring_providers" ADD CONSTRAINT "referring_providers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referring_providers" ADD CONSTRAINT "referring_providers_practice_id_referring_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."referring_practices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_patient_idx" ON "consent_records" USING btree ("patient_id","channel","purpose","recorded_at");--> statement-breakpoint
CREATE INDEX "outreach_referrer_idx" ON "outreach_activities" USING btree ("referring_provider_id","occurred_at");--> statement-breakpoint
CREATE INDEX "patients_org_idx" ON "patients" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "referral_events_referral_idx" ON "referral_events" USING btree ("referral_id","at");--> statement-breakpoint
CREATE INDEX "referrals_org_status_idx" ON "referrals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referring_provider_id","received_at");--> statement-breakpoint
CREATE INDEX "referring_practices_org_idx" ON "referring_practices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "referring_providers_org_idx" ON "referring_providers" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referring_providers_org_email_uq" ON "referring_providers" USING btree ("organization_id","email");