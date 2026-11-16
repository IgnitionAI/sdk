import { describe, expect, mock, test } from "bun:test";
import { IgnitionAI, InternalServerError, OfferingUnavailableError } from "../src/index";

function createClient() {
  const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify({
    success: true,
    jobId: "job_1",
    message: "started",
    pages: [],
    totalFound: 0,
    duration: 4,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }))) as unknown as typeof fetch;
  return {
    client: new IgnitionAI({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 0,
    }),
    fetchMock,
  };
}

describe("async ingestion", () => {
  test("covers contract async and discovery endpoints", async () => {
    const { client, fetchMock } = createClient();
    const file = new Blob(["hello"], { type: "text/plain" });

    await client.ingest.fileAsync({
      collectionId: "coll_1",
      file,
      enableMultimodal: true,
    });
    await client.ingest.crawlAsync({ collectionId: "coll_1", url: "https://example.com" });
    await client.ingest.datasetAsync({ collectionId: "coll_1", datasetId: "acme/docs" });
    await client.ingest.discover({ url: "https://example.com", maxPages: 25 });
    await client.ingest.crawlSelectedAsync({
      collectionId: "coll_1",
      urls: ["https://example.com/a"],
    });

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "http://localhost/api/ingest/file/async",
      "http://localhost/api/ingest/crawl/async",
      "http://localhost/api/ingest/dataset/async",
      "http://localhost/api/ingest/discover",
      "http://localhost/api/ingest/crawl-selected/async",
    ]);
    const form = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(form.get("collectionId")).toBe("coll_1");
    expect(form.get("enableMultimodal")).toBe("true");
    expect(form.has("ocrMode")).toBe(false);
  });

  test("file() uses durable async ingestion", async () => {
    const { client, fetchMock } = createClient();
    await client.ingest.file({
      collectionId: "coll_1",
      file: new Blob(["a,b"], { type: "text/csv" }),
      enableMultimodal: false,
      mode: "tabular",
      ocrMode: "disabled",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost/api/ingest/file/async");
    const form = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(form.get("mode")).toBe("tabular");
    expect(form.get("ocrMode")).toBe("disabled");
    expect(form.get("enableMultimodal")).toBe("false");
  });

  test("url() queues durable async URL ingestion for SaaS members", async () => {
    const { client, fetchMock } = createClient();
    const started = await client.ingest.url({
      collectionId: "coll_1",
      url: "https://example.com/guide",
      enableMultimodal: true,
    });

    expect(started.jobId).toBe("job_1");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost/api/ingest/url/async");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      collectionId: "coll_1",
      url: "https://example.com/guide",
      enableMultimodal: true,
      maxPages: 1,
    });
  });

  test("document() uploads raw text through durable file ingestion", async () => {
    const { client, fetchMock } = createClient();
    await client.ingest.document({
      collectionId: "coll_1",
      content: "hello from sdk",
      filename: "note.txt",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost/api/ingest/file/async");
    const form = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(form.get("collectionId")).toBe("coll_1");
    const file = form.get("file") as File;
    expect(file).toBeInstanceOf(Blob);
    expect(file.name).toBe("note.txt");
    expect(await file.text()).toBe("hello from sdk");
  });

  test("closed SaaS ingest methods raise OfferingUnavailableError instead of a 503 outage", async () => {
    const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify({
      error: "AI_TEMPORARILY_UNAVAILABLE",
      message: "This operation is temporarily unavailable.",
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }))) as unknown as typeof fetch;
    const client = new IgnitionAI({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 2,
    });

    const closed = [
      () => client.ingest.crawl({ collectionId: "coll_1", url: "https://example.com" }),
      () => client.ingest.dataset({ collectionId: "coll_1", datasetId: "acme/docs" }),
      () => client.ingest.discover({ url: "https://example.com" }),
    ];

    for (const call of closed) {
      try {
        await call();
        throw new Error("expected OfferingUnavailableError");
      } catch (error) {
        expect(error).toBeInstanceOf(OfferingUnavailableError);
        expect(error).not.toBeInstanceOf(InternalServerError);
        expect((error as OfferingUnavailableError).code).toBe("OFFERING_UNAVAILABLE");
        expect((error as OfferingUnavailableError).message).toContain("not available on this offering");
      }
    }

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "http://localhost/api/ingest/crawl",
      "http://localhost/api/ingest/dataset",
      "http://localhost/api/ingest/discover",
    ]);
  });

  test("tracks, lists, streams and cancels durable jobs", async () => {
    const job = {
      id: "job/1",
      collectionId: "coll_1",
      source: "crawl",
      status: "completed",
      progress: { current: 1, total: 1, step: "indexing" },
      metrics: {},
      startedAt: "2026-08-19T00:00:00.000Z",
    };
    const fetchMock = mock((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/stream")) {
        return Promise.resolve(new Response(
          `event: state\ndata: ${JSON.stringify(job)}\n\n`,
          { headers: { "Content-Type": "text/event-stream" } },
        ));
      }
      if (url.includes("?collectionId=")) {
        return Promise.resolve(Response.json({ success: true, jobs: [job] }));
      }
      if (url.endsWith("/cancel")) {
        return Promise.resolve(Response.json({ success: true, message: "requested" }));
      }
      return Promise.resolve(Response.json({ success: true, job }));
    }) as unknown as typeof fetch;
    const client = new IgnitionAI({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 0,
    });

    expect((await client.ingest.getJob("job/1")).job.id).toBe("job/1");
    expect((await client.ingest.listJobs("coll/1")).jobs).toHaveLength(1);
    const events = [];
    for await (const event of client.ingest.streamJob("job/1")) events.push(event);
    expect(events).toEqual([{ type: "state", data: job }]);
    expect((await client.ingest.cancelJob("job/1")).success).toBe(true);

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "http://localhost/api/ingest/jobs/job%2F1",
      "http://localhost/api/ingest/jobs?collectionId=coll%2F1",
      "http://localhost/api/ingest/jobs/job%2F1/stream",
      "http://localhost/api/ingest/jobs/job%2F1/cancel",
    ]);
  });
});
