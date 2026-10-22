CREATE TABLE "project_event_visitors" (
	"project_id" integer NOT NULL,
	"type" "project_event_type" NOT NULL,
	"source" "project_event_source" NOT NULL,
	"day" date NOT NULL,
	"visitor" varchar(32) NOT NULL,
	CONSTRAINT "project_event_visitors_project_id_type_source_day_visitor_pk" PRIMARY KEY("project_id","type","source","day","visitor")
);
--> statement-breakpoint
ALTER TABLE "project_event_visitors" ADD CONSTRAINT "project_event_visitors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_event_visitors_day_idx" ON "project_event_visitors" USING btree ("day");