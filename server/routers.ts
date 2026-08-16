import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getCaptureSettings, getDatasetOverview, listCameras, listSnapshots, updateCameraConfig, updateCaptureSettings } from "./dataset";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  dataset: router({
    overview: protectedProcedure.query(() => getDatasetOverview()),
    cameras: protectedProcedure.query(() => listCameras()),
    captureSettings: protectedProcedure.query(() => getCaptureSettings()),
    snapshots: protectedProcedure.input(z.object({
      cameraId: z.string().min(1).optional(),
      from: z.date().optional(),
      to: z.date().optional(),
      limit: z.number().int().min(1).max(120).default(60),
    })).query(({ input }) => listSnapshots(input)),
    updateCamera: adminProcedure.input(z.object({
      id: z.string().min(1).max(96),
      sourceUrl: z.url().nullable().optional(),
      sourceKind: z.enum(["hls", "snapshot"]).optional(),
      sourceStatus: z.enum(["pending", "verified", "invalid"]).optional(),
      isActive: z.boolean().optional(),
      captureIntervalMinutes: z.enum(["1", "5", "10", "15"]).nullable().optional(),
    })).mutation(({ input }) => updateCameraConfig(input)),
    updateCaptureSettings: adminProcedure.input(z.object({
      intervalMinutes: z.enum(["1", "5", "10", "15"]),
      isEnabled: z.boolean(),
    })).mutation(({ input }) => updateCaptureSettings(input)),
  }),
});

export type AppRouter = typeof appRouter;
