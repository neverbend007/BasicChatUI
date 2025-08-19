import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const getWebhookUrl = () => {
  if (process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_URL.length > 0) {
    return process.env.N8N_WEBHOOK_URL;
  }
  return "https://neverbend007.app.n8n.cloud/webhook/7365a5cd-d9f3-4050-9c27-ec382d77b6e6";
};

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as { message?: string; text?: string; prompt?: string; input?: string; query?: string };
    const candidate = body?.message || body?.text || body?.prompt || body?.input || body?.query || "";
    if (!candidate || candidate.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save user message to database
    await prisma.chatMessage.create({
      data: {
        content: candidate,
        role: "user",
        userId: session.user.id,
      },
    });

    const webhookUrl = getWebhookUrl();
    
    // Send JSON with email to webhook
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain;q=0.8, */*;q=0.5",
      },
      body: JSON.stringify({
        message: candidate,
        userEmail: session.user.email,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({ error: "Webhook error", detail: `${res.status}: ${errorText}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    let replyCandidate = "";

    if (contentType.includes("application/json")) {
      const payload = await res.json();
      
      // Handle array response (new format)
      if (Array.isArray(payload) && payload.length > 0 && payload[0]?.output) {
        replyCandidate = payload[0].output;
      }
      // Handle direct output field
      else if (payload?.output) {
        replyCandidate = payload.output;
      }
      // Handle nested reply structure (old format)
      else if (payload?.reply && typeof payload.reply === 'string') {
        try {
          const parsed = JSON.parse(payload.reply);
          if (parsed?.response && Array.isArray(parsed.response) && parsed.response.length > 0) {
            replyCandidate = parsed.response[0]?.output || "";
          } else if (parsed?.output) {
            replyCandidate = parsed.output;
          } else {
            replyCandidate = payload.reply;
          }
        } catch (error) {
          console.error("Failed to parse reply JSON:", error, payload.reply);
          replyCandidate = payload.reply;
        }
      } else {
        console.log("No recognized format, using fallback. Payload:", JSON.stringify(payload));
        replyCandidate = payload?.text ?? payload?.message ?? JSON.stringify(payload);
      }
    } else {
      replyCandidate = await res.text();
    }

    console.log("Final replyCandidate before returning:", replyCandidate);
    
    // Save assistant response to database
    await prisma.chatMessage.create({
      data: {
        content: String(replyCandidate),
        role: "assistant",
        userId: session.user.id,
      },
    });

    return new Response(JSON.stringify({ reply: String(replyCandidate) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Invalid request or upstream failure", detail: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}