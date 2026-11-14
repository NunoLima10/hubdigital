import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "@/hooks/autenticate";
import { requirePublisher } from "@/hooks/require-publisher";
import {
  announcementBodySchema,
  announcementSchema,
  makerMembershipSchema,
  makerContributionRoleSchema,
  WEEK_ID_PATTERN,
} from "@hubdigital/shared";
import { currentWeek, weekFromId } from "@/utils/week";
import { BadRequestError } from "@/utils/custom-errors";
import * as service from "./community-services";
export async function communityRoutes(server: FastifyInstance) {
  const projectParams = z.object({ id: z.coerce.number().int().positive() });
  server.post("/projects/:id/announcements", {
    preHandler: requirePublisher,
    schema: { params: projectParams, body: announcementBodySchema },
    handler: async (req) => ({
      data: await service.createAnnouncement(
        req.db,
        req.publisher,
        (req.params as { id: number }).id,
        req.body as z.infer<typeof announcementBodySchema>,
      ),
    }),
  });
  server.get("/announcements", {
    schema: {
      querystring: z.object({
        projectId: z.coerce.number().int().positive().optional(),
        week: z.string().regex(WEEK_ID_PATTERN).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      }),
      response: { 200: z.object({ data: z.array(announcementSchema) }) },
    },
    handler: async (req) => {
      const query = req.query as {
        projectId?: number;
        week?: string;
        limit: number;
        offset: number;
      };
      if (query.week && !weekFromId(query.week))
        throw new BadRequestError("Semana inválida.");
      return {
        data: await service.listAnnouncements(req.db, {
          ...query,
          week: query.projectId
            ? query.week
            : (query.week ?? currentWeek().weekId),
          userId: req.user?.id,
        }),
      };
    },
  });
  server.get("/projects/:id/announcements/mine", {
    preHandler: requirePublisher,
    schema: {
      params: projectParams,
      response: { 200: z.object({ data: z.array(announcementSchema) }) },
    },
    handler: async (req) => ({
      data: await service.listAnnouncements(req.db, {
        projectId: (req.params as { id: number }).id,
        ownerId: req.publisher.id,
        userId: req.user?.id,
      }),
    }),
  });
  server.post("/announcements/:id/vote", {
    preHandler: authenticate,
    schema: { params: projectParams },
    handler: async (req) => ({
      data: await service.toggleAnnouncementVote(
        req.db,
        (req.params as { id: number }).id,
        req.user!.id,
      ),
    }),
  });
  server.get("/projects/:id/makers", {
    schema: {
      params: projectParams,
      response: { 200: z.object({ data: z.array(makerMembershipSchema) }) },
    },
    handler: async (req) => ({
      data: await service.listMakers(
        req.db,
        (req.params as { id: number }).id,
        req.user?.id,
      ),
    }),
  });
  server.post("/projects/:id/makers", {
    preHandler: requirePublisher,
    schema: {
      params: projectParams,
      body: z.object({
        handle: z.string().trim().min(1).max(80),
        role: makerContributionRoleSchema.optional(),
      }),
    },
    handler: async (req) => ({
      data: await service.inviteMaker(
        req.db,
        req.publisher,
        (req.params as { id: number }).id,
        (req.body as { handle: string }).handle,
        (req.body as { role?: string }).role,
      ),
    }),
  });
  server.get("/projects/:id/makers/search", {
    preHandler: requirePublisher,
    schema: {
      params: projectParams,
      querystring: z.object({ q: z.string().trim().min(2).max(80) }),
    },
    handler: async (req) => ({
      data: await service.searchMakers(
        req.db,
        (req.params as { id: number }).id,
        req.publisher.id,
        (req.query as { q: string }).q,
      ),
    }),
  });
  const membershipParams = projectParams.extend({
    membershipId: z.coerce.number().int().positive(),
  });
  server.patch("/projects/:id/makers/:membershipId", {
    preHandler: requirePublisher,
    schema: {
      params: membershipParams,
      body: z.object({ role: makerContributionRoleSchema }),
    },
    handler: async (req) => {
      const { id, membershipId } = req.params as {
        id: number;
        membershipId: number;
      };
      return {
        data: await service.updateMakerRole(
          req.db,
          id,
          req.publisher.id,
          membershipId,
          (req.body as { role: string }).role,
        ),
      };
    },
  });
  server.delete("/projects/:id/makers/:membershipId", {
    preHandler: requirePublisher,
    schema: { params: membershipParams },
    handler: async (req) => {
      const { id, membershipId } = req.params as {
        id: number;
        membershipId: number;
      };
      return {
        data: await service.removeMaker(
          req.db,
          id,
          req.publisher.id,
          membershipId,
        ),
      };
    },
  });
  server.get("/maker-invitations", {
    preHandler: authenticate,
    handler: async (req) => ({
      data: await service.makerInvitations(req.db, req.user!.id),
    }),
  });
  server.post("/maker-invitations/:id", {
    preHandler: authenticate,
    schema: { params: projectParams, body: z.object({ accept: z.boolean() }) },
    handler: async (req) => ({
      data: await service.replyToMakerInvitation(
        req.db,
        (req.params as { id: number }).id,
        req.user!.id,
        (req.body as { accept: boolean }).accept,
      ),
    }),
  });
}
