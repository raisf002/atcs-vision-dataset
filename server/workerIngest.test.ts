import express from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { registerWorkerIngestRoutes } from "./workerIngest";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("worker ingest authentication", () => {
  it("accepts the configured server-side worker token and rejects an invalid token", async () => {
    const token = process.env.CAPTURE_WORKER_INGEST_TOKEN;
    expect(token).toBeTruthy();

    const app = express();
    app.use(express.json());
    registerWorkerIngestRoutes(app);
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server address unavailable");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const rejected = await fetch(`${baseUrl}/api/worker/cameras`, { headers: { authorization: "Bearer invalid-token" } });
    expect(rejected.status).toBe(401);

    const accepted = await fetch(`${baseUrl}/api/worker/cameras`, { headers: { authorization: `Bearer ${token}` } });
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toMatchObject({ cameras: expect.any(Array), generatedAt: expect.any(String) });
  });
});
