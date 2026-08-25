import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getCameraCountingConfig, listVisionModels, saveCameraCountingConfig } from "./counting";
import { getCaptureAvailability, getCaptureSettings, getDailySnapshotCounts, getDatasetOverview, getDatasetPolicy, getSnapshotStatsByCamera, getTrainingReadiness, listCameras, listDatasetExportAudits, listSnapshotAnnotations, listSnapshots, saveSnapshotAnnotation, updateCameraConfig, updateCaptureSettings, updateDatasetPolicy } from "./dataset";

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
    overview: publicProcedure.query(() => getDatasetOverview()),
    cameras: publicProcedure.query(() => listCameras()),
    captureSettings: publicProcedure.query(() => getCaptureSettings()),
    datasetPolicy: publicProcedure.query(() => getDatasetPolicy()),
    snapshots: publicProcedure.input(z.object({
      cameraId: z.string().min(1).optional(),
      from: z.date().optional(),
      to: z.date().optional(),
      limit: z.number().int().min(1).max(120).default(60),
    })).query(({ input }) => listSnapshots(input)),
    trainingReadiness: publicProcedure.input(z.object({
      cameraId: z.string().min(1).optional(),
      from: z.date().optional(),
      to: z.date().optional(),
      limit: z.number().int().min(1).max(120).default(120),
    })).query(({ input }) => getTrainingReadiness(input)),
    snapshotAnnotations: publicProcedure.input(z.object({ snapshotIds: z.array(z.number().int().positive()).min(1).max(120) })).query(({ input }) => listSnapshotAnnotations(input.snapshotIds)),
    dailyStats: publicProcedure.input(z.object({ days: z.number().int().min(1).max(31).default(7) })).query(({ input }) => getDailySnapshotCounts(input.days)),
    availability: publicProcedure.input(z.object({ days: z.number().int().min(1).max(31).default(7) }).optional()).query(({ input }) => getCaptureAvailability(input?.days ?? 7)),
    cameraStats: publicProcedure.query(async () => {
      const cameraRows = await listCameras();
      return getSnapshotStatsByCamera(cameraRows.map((camera) => camera.id));
    }),
    visionModels: publicProcedure.input(z.object({ cameraId: z.string().min(1).max(96) }).optional()).query(({ input }) => listVisionModels(input?.cameraId)),
    countingConfig: publicProcedure.input(z.object({ cameraId: z.string().min(1).max(96) })).query(({ input }) => getCameraCountingConfig(input.cameraId)),
    exportAudits: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional()).query(({ input }) => listDatasetExportAudits(input?.limit ?? 20)),
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
    updateDatasetPolicy: adminProcedure.input(z.object({
      classMap: z.array(z.string().trim().min(1).max(64)).min(1).max(64),
      retentionDays: z.number().int().min(1).max(3650),
      retentionEnabled: z.boolean(),
    })).mutation(({ input, ctx }) => updateDatasetPolicy(input, ctx.user.id)),
    saveSnapshotAnnotation: adminProcedure.input(z.object({
      snapshotId: z.number().int().positive(),
      yoloText: z.string().trim().min(1).max(20_000),
      status: z.enum(["draft", "approved", "rejected"]),
    })).mutation(({ input, ctx }) => saveSnapshotAnnotation(input, ctx.user.id)),
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
