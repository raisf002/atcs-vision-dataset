import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getCameraCountingConfig, listVisionModels, saveCameraCountingConfig } from "./counting";
import { getCaptureSettings, getDailySnapshotCounts, getDatasetOverview, getSnapshotStatsByCamera, listCameras, listSnapshots, updateCameraConfig, updateCaptureSettings } from "./dataset";

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
    dailyStats: protectedProcedure.input(z.object({ days: z.number().int().min(1).max(31).default(7) })).query(({ input }) => getDailySnapshotCounts(input.days)),
    cameraStats: protectedProcedure.query(async () => {
      const cameraRows = await listCameras();
      return getSnapshotStatsByCamera(cameraRows.map((camera) => camera.id));
    }),
    visionModels: protectedProcedure.query(() => listVisionModels()),
    countingConfig: protectedProcedure.input(z.object({ cameraId: z.string().min(1).max(96) })).query(({ input }) => getCameraCountingConfig(input.cameraId)),
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
    saveCountingConfig: adminProcedure.input(z.object({
      cameraId: z.string().min(1).max(96),
      modelId: z.string().min(1).max(64).nullable(),
      isEnabled: z.boolean(),
      confidenceThreshold: z.number().int().min(10).max(90),
      virtualLines: z.array(z.object({
        id: z.string().min(1).max(64),
        name: z.string().min(1).max(80),
        start: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
        end: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
        direction: z.enum(["both", "a_to_b", "b_to_a"]),
        enabled: z.boolean(),
      })).max(12),
      classFilter: z.array(z.string().min(1).max(40)).min(1).max(16),
    })).mutation(({ input, ctx }) => saveCameraCountingConfig(input, ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
