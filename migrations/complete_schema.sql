-- =============================================================================
-- TimeTrack Complete Database Schema
-- =============================================================================
-- This file contains all migrations consolidated into a single SQL file
-- Generated from migrations 0000, 0001, and 0002
-- =============================================================================

-- =============================================================================
-- Migration 0000: Initial Schema (tan_white_queen)
-- =============================================================================

-- Table: clients
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Table: project_assignments
CREATE TABLE "project_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Table: projects
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"client_id" varchar NOT NULL,
	"budget" numeric(10, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Table: sessions
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

-- Table: time_entries
CREATE TABLE "time_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"is_billable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Table: users
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"username" text,
	"password" text,
	"name" text,
	"role" text DEFAULT 'member' NOT NULL,
	"hourly_rate" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

-- Foreign Keys for Initial Schema
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;

-- Indexes for Initial Schema
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");

-- =============================================================================
-- Migration 0001: Multi-Tenant Architecture (previous_dreaming_celestial)
-- =============================================================================

-- Table: tenants
CREATE TABLE "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);

-- Table: workspace_memberships
CREATE TABLE "workspace_memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"title" text,
	"invited_by" varchar,
	"joined_at" timestamp DEFAULT now() NOT NULL
);

-- Table: workspaces
CREATE TABLE "workspaces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"timezone" text DEFAULT 'UTC',
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add workspace_id columns to existing tables
ALTER TABLE "clients" ADD COLUMN "workspace_id" varchar NOT NULL;
ALTER TABLE "project_assignments" ADD COLUMN "workspace_id" varchar NOT NULL;
ALTER TABLE "projects" ADD COLUMN "workspace_id" varchar NOT NULL;
ALTER TABLE "time_entries" ADD COLUMN "workspace_id" varchar NOT NULL;

-- Foreign Keys for Multi-Tenant Tables
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes for Workspace Tables
CREATE INDEX "idx_workspace_memberships_workspace_id" ON "workspace_memberships" USING btree ("workspace_id");
CREATE INDEX "idx_workspace_memberships_user_id" ON "workspace_memberships" USING btree ("user_id");
CREATE INDEX "idx_workspaces_tenant_id" ON "workspaces" USING btree ("tenant_id");
CREATE INDEX "idx_workspaces_status" ON "workspaces" USING btree ("status");

-- Foreign Keys for workspace_id columns
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes for Business Entity Tables
CREATE INDEX "idx_clients_workspace_id" ON "clients" USING btree ("workspace_id");
CREATE INDEX "idx_clients_workspace_status" ON "clients" USING btree ("workspace_id","status");
CREATE INDEX "idx_project_assignments_workspace_id" ON "project_assignments" USING btree ("workspace_id");
CREATE INDEX "idx_project_assignments_user_id" ON "project_assignments" USING btree ("user_id");
CREATE INDEX "idx_project_assignments_project_id" ON "project_assignments" USING btree ("project_id");
CREATE INDEX "idx_projects_workspace_id" ON "projects" USING btree ("workspace_id");
CREATE INDEX "idx_projects_client_id" ON "projects" USING btree ("client_id");
CREATE INDEX "idx_projects_workspace_status" ON "projects" USING btree ("workspace_id","status");
CREATE INDEX "idx_time_entries_workspace_id" ON "time_entries" USING btree ("workspace_id");
CREATE INDEX "idx_time_entries_user_id" ON "time_entries" USING btree ("user_id");
CREATE INDEX "idx_time_entries_project_id" ON "time_entries" USING btree ("project_id");

-- =============================================================================
-- Migration 0002: Stripe Payment Integration (chubby_spencer_smythe)
-- =============================================================================

-- Add payment-related columns to tenants table
ALTER TABLE "tenants" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN "stripe_customer_id" varchar;
ALTER TABLE "tenants" ADD COLUMN "stripe_subscription_id" varchar;

-- =============================================================================
-- Complete Schema Summary
-- =============================================================================
-- Core Tables:
--   - users: User accounts (OAuth + local auth)
--   - tenants: Organizations with billing plans
--   - workspaces: Teams/departments within tenants
--   - workspace_memberships: User roles within workspaces
--   - clients: Customer/client entities (workspace-scoped)
--   - projects: Project entities (workspace-scoped)
--   - project_assignments: User-project associations
--   - time_entries: Time tracking records (workspace-scoped)
--   - sessions: Express session storage
--
-- Key Features:
--   - Multi-tenant architecture with workspace isolation
--   - Role-based access control via workspace memberships
--   - Stripe payment integration for tenant billing
--   - Comprehensive indexing for query performance
--   - CASCADE deletes for data integrity
-- =============================================================================
