import { type NextRequest } from "next/server";
import { type PoolClient } from "pg";
import { listenPool } from "@/db";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSE endpoint. Clients open this connection on login; we hold it open and
 * push `notification` events the moment Postgres NOTIFY fires.
 *
 * The DispatchNotification helper writes a NOTIFY 'notification_inserted'
 * after inserting a row; this route filters those events by user id and
 * forwards them to the right client.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      function write(event: string, data: unknown) {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // controller is closed
        }
      }

      let client: PoolClient | null = null;
      let heartbeat: NodeJS.Timeout | null = null;
      let closed = false;

      async function cleanup() {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (client) {
          try {
            await client.query("UNLISTEN notification_inserted");
          } catch {}
          client.release();
        }
        try {
          controller.close();
        } catch {}
      }

      try {
        client = await listenPool.connect();
        await client.query("LISTEN notification_inserted");

        client.on("notification", (msg) => {
          if (msg.channel !== "notification_inserted" || !msg.payload) return;
          try {
            const parsed = JSON.parse(msg.payload) as {
              userId: string;
              notificationId: string;
              kind: string;
            };
            if (parsed.userId === userId) {
              write("notification", parsed);
            }
          } catch {
            // ignore malformed payloads
          }
        });

        // Initial hello so clients know the stream is live
        write("hello", { userId });

        // Heartbeat to keep the connection alive past proxies / load balancers
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            cleanup();
          }
        }, 25_000);

        req.signal.addEventListener("abort", () => {
          void cleanup();
        });
      } catch (err) {
        console.error("[sse] startup failure:", err);
        await cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
