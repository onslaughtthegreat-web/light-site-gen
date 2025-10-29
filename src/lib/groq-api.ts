let BAYMAX_ENDPOINT: string = "";
const STORAGE_KEY = "baymax_chat_history";
const globalValue =
	(typeof globalThis !== "undefined" &&
		(globalThis as unknown as Record<string, unknown>)["BAYMAX_ENDPOINT"]) ||
	undefined;

if (typeof globalValue === "string") {
	BAYMAX_ENDPOINT = globalValue;
} else if (
	typeof process !== "undefined" &&
	process.env?.VITE_BAYMAX_ENDPOINT
) {
	BAYMAX_ENDPOINT = process.env.VITE_BAYMAX_ENDPOINT;
} else if (
	typeof import.meta !== "undefined" &&
	import.meta.env?.VITE_BAYMAX_ENDPOINT
) {
	BAYMAX_ENDPOINT = import.meta.env.VITE_BAYMAX_ENDPOINT;
} else {
	BAYMAX_ENDPOINT = "0.0.0.0"; // fallback
}



async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function fetchUserHistory(): Promise<
	{ role: string; content: string }[]
> {
	const token = getToken();
	if (!token) {
		console.warn("No token found for history fetch");
		return [];
	}

	const endpoint = `${BAYMAX_ENDPOINT.replace(/\/$/, "")}/history`;

	try {
		const res = await fetch(endpoint, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			console.error("History fetch failed:", res.status, text);
			throw new Error(`Failed to fetch history: ${text}`);
		}

		const data = await res.json();

		// Worker now returns normalized format already
		const normalized = Array.isArray(data) ? data : [];

		// Convert to Message format for BaymaxChat
		const messages = normalized.map((item: any, index: number) => ({
			id: `history-${index}`,
			content: item.content || "",
			sender: item.role === "user" ? "user" : "bot",
			timestamp: new Date(),
		}));

		// Store in localStorage
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
		} catch (err) {
			console.warn("Failed to store history in localStorage:", err);
		}

		return normalized;
	} catch (error) {
		console.error("Error fetching history:", error);

		// Try fallback from cache if available
		const cached = localStorage.getItem(STORAGE_KEY);
		if (cached) {
			try {
				const parsed = JSON.parse(cached);
				// Convert back to role/content format
				return parsed.map((msg: any) => ({
					role: msg.sender === "user" ? "user" : "assistant",
					content: msg.content,
				}));
			} catch {
				return [];
			}
		}

		return [];
	}
}

// ------------------------
// Auth Functions
// ------------------------
const TOKEN_EXPIRY_DAYS = 7;

export async function signup(
	username: string,
	password: string
): Promise<string> {
	const res = await fetch(`${BAYMAX_ENDPOINT}/signup`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password }),
	});
	if (!res.ok) throw new Error(`Signup failed: ${await res.text()}`);
	const data = await res.json();

	const tokenData = {
		token: data.token,
		createdAt: Date.now(),
	};

	localStorage.setItem("baymax_token", JSON.stringify(tokenData));
	return data.token;
}

export async function login(
	username: string,
	password: string
): Promise<{ token: string; history: any[] }> {
	const res = await fetch(`${BAYMAX_ENDPOINT}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password }),
	});

	if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
	const data = await res.json();

	const tokenData = {
		token: data.token,
		createdAt: Date.now(),
	};

	localStorage.setItem("baymax_token", JSON.stringify(tokenData));

	// Immediately fetch user history after login
	const history = await fetchUserHistory().catch((err) => {
		console.warn("History fetch after login failed:", err);
		return [];
	});

	return { token: data.token, history };
}

export function getToken(): string | null {
	const item = localStorage.getItem("baymax_token");
	if (!item) return null;

	try {
		const tokenData = JSON.parse(item) as { token: string; createdAt: number };
		const age = Date.now() - tokenData.createdAt;
		const maxAge = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms

		if (age > maxAge) {
			localStorage.removeItem("baymax_token");
			window.location.reload(); // refresh page if token expired
			return null;
		}

		return tokenData.token;
	} catch {
		localStorage.removeItem("baymax_token"); // corrupted data
		return null;
	}
}
interface WorkerChoice {
	message?: { content?: string };
	text?: string;
	[k: string]: unknown;
}

interface WorkerResponseShape {
	reply?: string;
	choices?: WorkerChoice[];
	refreshToken?: string;
	[k: string]: unknown;
}

export async function sendMessageToBaymax(message: string): Promise<string> {
	const token = getToken();

	if (!token) throw new Error("User not logged in");

	const payload = { userMessage: message };

	try {
		const res = await fetch(BAYMAX_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const text = await res.text();
			let parsed: any;
			try {
				parsed = JSON.parse(text);
			} catch {
				parsed = text;
			}
			throw new Error(`Worker error ${res.status}: ${JSON.stringify(parsed)}`);
		}

		const contentType = res.headers.get("Content-Type") || "";
		let data: any;

		if (contentType.includes("application/json")) {
			data = await res.json();
		} else {
			const text = await res.text();
			try {
				data = JSON.parse(text);
			} catch {
				return text || getMockBaymaxResponse(message);
			}
		}
		if (data?.refreshToken) {
			localStorage.setItem("baymax_token", data.refreshToken);
		}
		const reply =
			data?.output?.refined ??
			data?.output?.raw ??
			data?.output?.choices?.[0]?.message?.content ??
			data?.output?.choices?.[0]?.text ??
			null;

		if (!reply) {
			console.warn("Baymax worker returned no reply:", data);
			return "Baymax is thinking... but didn’t respond clearly.";
		}

		return reply.trim();
	} catch (err) {
		console.error("Error calling Baymax proxy:", err);
		return getMockBaymaxResponse(message);
	}
}

// ------------------------
// Session Clear
// ------------------------
export async function clearBaymaxSession(): Promise<boolean> {
	const token = getToken();
	if (!token) throw new Error("User not logged in");
	const endpoint = `${BAYMAX_ENDPOINT.replace(/\/$/, "")}/clear`;

	try {
		const res = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) return false;

		const data = await res.json();
		if (data.refreshToken)
			localStorage.setItem("baymax_token", data.refreshToken);

		return data.success === true;
	} catch (err) {
		console.error("Clear session error:", err);
		return false;
	}
}

// ------------------------
// Mock Responses
// ------------------------
export function getMockBaymaxResponse(message: string): string {
	const lowerMessage = message.toLowerCase();
	if (/(pain|hurt|ache)/.test(lowerMessage))
		return "I understand you are experiencing discomfort. On a scale of 1 to 10, how would you rate your pain?";
	if (/(stress|anxious|worried)/.test(lowerMessage))
		return "I detect elevated stress indicators. Try deep breathing and short walks; would you like a guided breathing exercise?";
	if (/(sleep|tired|fatigue)/.test(lowerMessage))
		return "Adults generally need 7–9 hours of sleep. Do you have trouble falling asleep or staying asleep?";
	if (/(exercise|workout|fitness)/.test(lowerMessage))
		return "Aim for 150 minutes of moderate exercise weekly. Want a 10-minute routine?";
	if (/(diet|nutrition|food)/.test(lowerMessage))
		return "Balanced diet: vegetables, whole grains, lean proteins, hydration. For specifics consider a dietitian.";
	if (/(hello|hi|hey)/.test(lowerMessage))
		return "Hello! I am Baymax, your personal healthcare companion. How can I help?";
	if (/(thank you|thanks)/.test(lowerMessage))
		return "You’re welcome — happy to help!";
	const general = [
		"Tell me more about what you are feeling so I can help better.",
		"Please describe your symptoms in a few words (duration, intensity).",
		"On a scale of 1–10, how severe is this for you right now?",
	];
	return general[Math.floor(Math.random() * general.length)];
}
