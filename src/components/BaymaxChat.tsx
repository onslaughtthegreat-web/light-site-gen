import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	sendMessageToBaymax,
	clearBaymaxSession,
	getSessionId,
} from "@/lib/groq-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
	id: string;
	content: string;
	sender: "user" | "bot";
	timestamp: Date;
}

interface BaymaxChatProps {
	className?: string;
	style?: React.CSSProperties;
}

const STORAGE_KEY = "baymax_messages"; // LOCALSTORAGE

const BaymaxChat: React.FC<BaymaxChatProps> = ({ className, style }) => {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			content:
				"Hello! I am Baymax, your personal healthcare companion. How can I help you today?",
			sender: "bot",
			timestamp: new Date(),
		},
	]);

	// ✅ Load from localStorage after first render (client-side only)
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				const restored = parsed.map((msg: any) => ({
					...msg,
					timestamp: new Date(msg.timestamp),
				}));
				setMessages(restored);
			}
		} catch (err) {
			console.warn("Failed to load chat history:", err);
		}
	}, []);

	const [inputValue, setInputValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// --- LOCALSTORAGE: Save messages on change ---
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
		} catch (err) {
			console.warn("Failed to save chat messages:", err);
		}
	}, [messages]);

	const simulateGroqAPI = async (message: string): Promise<string> => {
		await new Promise((resolve) =>
			setTimeout(resolve, 1000 + Math.random() * 2000)
		);
		return sendMessageToBaymax(message);
	};

	const sendMessage = async () => {
		if (!inputValue.trim() || isLoading) return;
		const trimmedInput = inputValue.trim();

		if (trimmedInput.toLowerCase() === "clear") {
			setInputValue("");
			setIsLoading(true);

			try {
				const sessionId = getSessionId();
				const success = await clearBaymaxSession(sessionId);

				const cleared = [
					{
						id: "1",
						content: success
							? "Chat history cleared. How can I help you today?"
							: "Chat cleared locally. How can I help you today?",
						sender: "bot",
						timestamp: new Date(),
					},
				];

				setMessages(cleared);

				// --- LOCALSTORAGE: Clear messages ---
				localStorage.removeItem(STORAGE_KEY);
				localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
			} catch (error) {
				console.error("Error clearing chat:", error);
			} finally {
				setIsLoading(false);
			}
			return;
		}

		const userMessage: Message = {
			id: Date.now().toString(),
			content: trimmedInput,
			sender: "user",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");
		setIsLoading(true);

		try {
			const response = await simulateGroqAPI(userMessage.content);

			const botMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: response,
				sender: "bot",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, botMessage]);
		} catch (error) {
			console.error("Error sending message:", error);
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				content:
					"I apologize, but I'm having trouble processing your request right now. Please try again later.",
				sender: "bot",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	return (
		<div
			className={cn(
				"flex flex-col h-full bg-card/80 backdrop-blur-xl rounded-xl md:rounded-3xl shadow-soft border border-border/50 overflow-hidden",
				"hover:shadow-glow transition-all duration-500",
				className
			)}
			style={style}
		>
			{/* HEADER */}
			<div className="flex items-center gap-2 md:gap-3 p-3 md:p-6 bg-card/30 border-b border-border/50 backdrop-blur-sm relative">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary-glow/5" />
				<div className="relative flex items-center gap-2 md:gap-3">
					<div className="relative">
						<img
							src="https://cdn.onslaught2342.qzz.io/assets/Images/Baymax.png"
							alt="Baymax"
							className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover animate-pulse-glow"
						/>
						<div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-card animate-gentle-bounce" />
					</div>

					<div>
						<h2 className="text-lg md:text-xl font-semibold text-foreground">
							Baymax
						</h2>
						<p className="text-xs md:text-sm text-muted-foreground">
							Your Personal Healthcare Companion
						</p>
					</div>
				</div>
			</div>

			{/* CHAT BODY */}
			<div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-transparent to-background/20">
				{messages.map((message, index) => (
					<div
						key={message.id}
						className={cn(
							"flex gap-2 md:gap-3 animate-message-in",
							message.sender === "user" ? "justify-end" : "justify-start"
						)}
						style={{ animationDelay: `${index * 0.1}s` }}
					>
						{message.sender === "bot" && (
							<img
								src="https://cdn.onslaught2342.qzz.io/assets/Images/Baymax.png"
								alt="Baymax"
								className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 mt-1 animate-float"
								loading="lazy"
							/>
						)}

						<div
							className={cn(
								"max-w-[85%] md:max-w-[75%] rounded-xl md:rounded-2xl px-3 py-3 md:px-5 md:py-4 shadow-message backdrop-blur-sm",
								"transition-all duration-300 hover:shadow-glow",
								message.sender === "user"
									? "bg-chat-user/90 text-chat-user-foreground rounded-br-md"
									: "bg-chat-bot/80 text-chat-bot-foreground border border-border/30 rounded-bl-md"
							)}
						>
							<div
								className={cn(
									"prose prose-sm max-w-none prose-invert break-words",
									message.sender === "user"
										? "prose-headings:text-chat-user-foreground prose-p:text-chat-user-foreground"
										: "prose-headings:text-chat-bot-foreground prose-p:text-chat-bot-foreground"
								)}
							>
								<ReactMarkdown remarkPlugins={[remarkGfm]}>
									{message.content}
								</ReactMarkdown>
							</div>

							<p
								className={cn(
									"text-[10px] md:text-xs mt-2 md:mt-3 opacity-60 font-medium",
									message.sender === "user"
										? "text-chat-user-foreground"
										: "text-muted-foreground"
								)}
							>
								{message.timestamp.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>

						{message.sender === "user" && (
							<img
								src="https://cdn.onslaught2342.qzz.io/assets/Images/logo.png"
								alt="User"
								className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 mt-1 animate-float"
								loading="lazy"
							/>
						)}
					</div>
				))}

				{isLoading && (
					<div className="flex gap-2 md:gap-3 animate-message-in">
						<div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse-glow">
							<img
								src="https://cdn.onslaught2342.qzz.io/assets/Images/Baymax.png"
								alt="Baymax"
								className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 mt-1 animate-pulse-glow"
								loading="lazy"
							/>
						</div>
						<div className="bg-chat-bot/80 border border-border/30 rounded-xl md:rounded-2xl rounded-bl-md px-3 py-3 md:px-5 md:py-4 shadow-message backdrop-blur-sm">
							<div className="flex gap-1 md:gap-1.5">
								<div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-muted-foreground rounded-full animate-typing" />
								<div
									className="w-2 h-2 md:w-2.5 md:h-2.5 bg-muted-foreground rounded-full animate-typing"
									style={{ animationDelay: "0.2s" }}
								/>
								<div
									className="w-2 h-2 md:w-2.5 md:h-2.5 bg-muted-foreground rounded-full animate-typing"
									style={{ animationDelay: "0.4s" }}
								/>
							</div>
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* INPUT AREA */}
			<div className="p-3 md:p-6 bg-card/20 border-t border-border/50 backdrop-blur-xl relative">
				<div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
				<div className="relative flex gap-2 md:gap-3 items-end">
					<div className="flex-1 relative">
						<Input
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Type your message to Baymax..."
							disabled={isLoading}
							className={cn(
								"min-h-[48px] md:min-h-[56px] rounded-xl md:rounded-2xl border-2 bg-chat-input/80 backdrop-blur-sm pr-12 resize-none",
								"border-chat-input-border hover:border-primary/30 focus:border-primary/50",
								"focus:shadow-glow transition-all duration-300 text-sm md:text-base",
								"placeholder:text-muted-foreground/60"
							)}
						/>
					</div>
					<Button
						onClick={sendMessage}
						disabled={!inputValue.trim() || isLoading}
						size="lg"
						className={cn(
							"rounded-xl md:rounded-2xl h-12 w-12 md:h-14 md:w-14 p-0 gradient-baymax shadow-soft transition-all duration-300",
							"hover:shadow-glow hover:scale-105 disabled:opacity-50 disabled:scale-100",
							"disabled:hover:shadow-soft"
						)}
					>
						<Send className="w-4 h-4 md:w-5 md:h-5" />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default BaymaxChat;
