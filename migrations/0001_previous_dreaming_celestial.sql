CREATE TABLE "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workspace_memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"title" text,
	"invited_by" varchar,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workspace_memberships_workspace_id" ON "workspace_memberships" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_memberships_user_id" ON "workspace_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspaces_tenant_id" ON "workspaces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_workspaces_status" ON "workspaces" USING btree ("status");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clients_workspace_id" ON "clients" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_clients_workspace_status" ON "clients" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_project_assignments_workspace_id" ON "project_assignments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_project_assignments_user_id" ON "project_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_assignments_project_id" ON "project_assignments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_projects_workspace_id" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_projects_client_id" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_projects_workspace_status" ON "projects" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_time_entries_workspace_id" ON "time_entries" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_user_id" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_project_id" ON "time_entries" USING btree ("project_id");