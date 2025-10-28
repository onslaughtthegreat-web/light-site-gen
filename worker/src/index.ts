/// <reference types="@cloudflare/workers-types" />
import { jwtVerify, createRemoteJWKSet } from "jose";

export interface Env {
	AUTH0_DOMAIN: string;
	AUTH0_AUDIENCE: string;
	GROQ_API_KEY: string;
	CHAT_HISTORY_BAYMAX_PROXY: KVNamespace;
	VECTOR_API_URL: string;
}

interface VectorResult {
	"Medicine Name"?: string;
	Uses?: string;
	Side_effects?: string;
}

interface VectorResponse {
	results: VectorResult[];
}

interface GroqChoice {
	message?: { content?: string };
	text?: string;
}

interface GroqResponse {
	choices?: GroqChoice[];
	reply?: string;
}

const MAX_HISTORY = 20;
const HISTORY_TTL = 60 * 60 * 24 * 30;

function corsHeaders(origin?: string) {
	const allowOrigin = origin ?? "*";
	return {
		"Access-Control-Allow-Origin": allowOrigin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	};
}

function jsonResponse(data: unknown, status = 200, origin?: string) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
	});
}

async function verifyAuth0Token(token: string, env: Env) {
	try {
		const JWKS = createRemoteJWKSet(
			new URL(`https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`)
		);

		const { payload } = await jwtVerify(token, JWKS, {
			issuer: `https://${env.AUTH0_DOMAIN}/`,
			audience: env.AUTH0_AUDIENCE,
		});

		if (!payload.sub) {
			throw new Error("No subject in token");
		}

		return {
			userId: payload.sub as string,
			email: payload.email as string | undefined,
		};
	} catch (error) {
		console.error("JWT verification failed:", error);
		throw new Response("Unauthorized: Invalid token", { status: 401 });
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get("Origin") || "";

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					...corsHeaders(origin),
					"Access-Control-Allow-Credentials": "true",
					"Access-Control-Max-Age": "86400",
				},
			});
		}

		const url = new URL(request.url);

		// Health check endpoint (public)
		if (url.pathname === "/health" && request.method === "GET") {
			return jsonResponse({ status: "healthy", timestamp: Date.now() }, 200, origin);
		}

		// All other endpoints require Auth0 authentication
		const authHeader = request.headers.get("Authorization") || "";
		const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
		if (!token) {
			return jsonResponse(
				{ error: "Unauthorized: missing token" },
				401,
				origin
			);
		}

		let userAuth: { userId: string; email?: string };
		try {
			userAuth = await verifyAuth0Token(token, env);
		} catch (err) {
			return err instanceof Response
				? err
				: jsonResponse({ error: "Unauthorized" }, 401, origin);
		}

		// Use userId as session identifier for consistent chat history per user
		const sessionId = userAuth.userId;

		if (url.pathname === "/clear" && request.method === "POST") {
			await env.CHAT_HISTORY_BAYMAX_PROXY.delete(sessionId);
			return jsonResponse(
				{ success: true, message: "Session cleared" },
				200,
				origin
			);
		}

		if (request.method !== "POST")
			return jsonResponse(
				{ error: "Only POST allowed" },
				405,
				origin
			);

		const contentType = (
			request.headers.get("Content-Type") || ""
		).toLowerCase();
		if (!contentType.includes("application/json"))
			return jsonResponse(
				{ error: "Expected application/json" },
				415,
				origin
			);

		let body: any;
		try {
			body = await request.json();
		} catch {
			return jsonResponse(
				{ error: "Invalid JSON body" },
				400,
				origin
			);
		}

		let userMessage =
			typeof body.userMessage === "string" ? body.userMessage.trim() : null;
		if (!userMessage)
			return jsonResponse(
				{ error: "Missing userMessage" },
				400,
				origin
			);
		if (userMessage.length > 20000)
			return jsonResponse(
				{ error: "userMessage too long" },
				413,
				origin
			);

		const sanitizedInput = userMessage.replace(/\s+/g, " ").trim();
		const historyRaw = await env.CHAT_HISTORY_BAYMAX_PROXY.get(sessionId);
		let history: Array<{ role: string; content: string }> = historyRaw
			? JSON.parse(historyRaw)
			: [
					{
						role: "system",
						content:
							"You are Baymax, a friendly medical AI giving safe health advice.",
					},
			  ];

		history.push({ role: "user", content: sanitizedInput });
		const systemMessage = history.find((m) => m.role === "system") ?? null;
		const nonSystem = history
			.filter((m) => m.role !== "system")
			.slice(-(MAX_HISTORY - (systemMessage ? 1 : 0)));
		history = systemMessage ? [systemMessage, ...nonSystem] : nonSystem;

		let context = "";
		let embeddings: any[] = [];
		try {
			const vectorRes = await fetch(env.VECTOR_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: sanitizedInput }),
			});
			const vectorData = (await vectorRes
				.json()
				.catch(() => null)) as VectorResponse | null;
			if (vectorData?.results?.length) {
				context = vectorData.results
					.map((r) => {
						const name = r["Medicine Name"] ?? "Unknown";
						const use = r["Uses"] ?? "N/A";
						const side = r["Side_effects"] ?? "None listed";
						return `• ${name}: Used for ${use}. Side effects: ${side}`;
					})
					.join("\n");
				embeddings = vectorData.results;
			}
		} catch {
			context = "";
		}

		if (context)
			history.unshift({
				role: "system",
				content: `Medical database context:\n${context}\n\nRespond as Baymax, using this data carefully.`,
			});

		const groqPayload = {
			model: "llama-3.1-8b-instant",
			messages: history,
			temperature: 0.7,
		};
		const startTime = Date.now();
		const groqRes = await fetch(
			"https://api.groq.com/openai/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${env.GROQ_API_KEY}`,
				},
				body: JSON.stringify(groqPayload),
			}
		);
		const latency = Date.now() - startTime;

		if (!groqRes.ok) {
			const errText = await groqRes.text().catch(() => "<no-body>");
			return jsonResponse(
				{
					error: "Upstream model error",
					upstreamStatus: groqRes.status,
					detail: errText,
				},
				502,
				origin
			);
		}

		const data = (await groqRes
			.json()
			.catch(() => null)) as GroqResponse | null;
		const rawReply =
			data?.choices?.[0]?.message?.content ??
			data?.choices?.[0]?.text ??
			(typeof data?.reply === "string" ? data.reply : null) ??
			"Model returned no reply";
		const refinedReply = rawReply.trim();

		history.push({ role: "assistant", content: refinedReply });
		await env.CHAT_HISTORY_BAYMAX_PROXY.put(
			sessionId,
			JSON.stringify(history),
			{ expirationTtl: HISTORY_TTL }
		);

		return jsonResponse(
			{
				input: { original: userMessage, sanitized: sanitizedInput, embeddings },
				output: {
					raw: rawReply,
					refined: refinedReply,
					choices: data?.choices ?? null,
				},
				nonSensitive: {
					context,
					metrics: {
						latency,
						historyLength: history.length,
						hallucinationDetected: false,
					},
				},
				user: {
					id: userAuth.userId,
					email: userAuth.email,
				},
			},
			200,
			origin
		);
	},
};
