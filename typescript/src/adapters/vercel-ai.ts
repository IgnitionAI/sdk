import type { ChatStream } from "../streaming.js";
import type { AgentChatStream } from "../streaming.js";

/**
 * Convert an IgnitionAI stream to a Vercel AI SDK-compatible Response.
 *
 * Works with `useChat()` from `ai/react`. The response uses the Vercel AI SDK
 * DataStream protocol: text deltas as `0:"text"\n`, data annotations as `2:[...]\n`.
 *
 * @example
 * ```ts
 * // app/api/chat/route.ts
 * import { IgnitionAI } from '@ignitionai/sdk'
 * import { toAIStreamResponse } from '@ignitionai/sdk/adapters/vercel-ai'
 *
 * const client = new IgnitionAI()
 *
 * export async function POST(req: Request) {
 *   const { messages } = await req.json()
 *   const stream = client.chat.stream({
 *     collectionId: process.env.COLLECTION_ID!,
 *     query: messages.at(-1).content,
 *     history: messages.slice(0, -1),
 *   })
 *   return toAIStreamResponse(stream)
 * }
 * ```
 */
export function toAIStreamResponse(
  stream: ChatStream | AgentChatStream
): Response {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          switch (event.type) {
            case "chunk": {
              // Vercel AI SDK DataStream text delta format: 0:"text"\n
              const escaped = JSON.stringify(event.content);
              controller.enqueue(encoder.encode(`0:${escaped}\n`));
              break;
            }
            case "sources": {
              // Send sources as data annotation: 2:[{...}]\n
              const annotation = JSON.stringify([
                {
                  type: "sources",
                  data: event.sources,
                },
              ]);
              controller.enqueue(encoder.encode(`8:${annotation}\n`));
              break;
            }
            case "error": {
              // Error format: 3:"error message"\n
              const errorMsg = JSON.stringify(event.error);
              controller.enqueue(encoder.encode(`3:${errorMsg}\n`));
              break;
            }
            case "done": {
              // Finish message: d:{"finishReason":"stop"}\n
              controller.enqueue(
                encoder.encode(`d:${JSON.stringify({ finishReason: "stop" })}\n`)
              );
              break;
            }
            // tool_call and tool_result are agent-specific, pass as annotations
            default: {
              if ("name" in event && event.type === "tool_call") {
                const annotation = JSON.stringify([
                  {
                    type: "tool_call",
                    data: { name: (event as any).name, args: (event as any).args },
                  },
                ]);
                controller.enqueue(encoder.encode(`8:${annotation}\n`));
              }
              break;
            }
          }
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown streaming error";
        controller.enqueue(
          encoder.encode(`3:${JSON.stringify(msg)}\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}
