import { useState, useEffect } from "react";
import BaymaxChat from "@/components/BaymaxChat";
import ThemeToggle from "@/components/ThemeToggle";
import MatrixBackground from "@/components/MatrixBackground";
import AuthPage from "./AuthPage";
import { getToken } from "@/lib/groq-api";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
	const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

	useEffect(() => {
		const token = getToken();
		setLoggedIn(!!token);
	}, []);

	// Logout function
	const handleLogout = () => {
		localStorage.removeItem("baymax_token");
		window.location.reload();
	};

	if (loggedIn === null) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!loggedIn) {
		return <AuthPage onLogin={() => setLoggedIn(true)} />;
	}

	// 🧠 When logged in, show BaymaxChat + Logout + ThemeToggle
	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			<MatrixBackground />

			{/* 🔘 Logout (top-left) */}
			<div className="absolute top-6 left-6 z-50">
				<Button
					variant="ghost"
					size="icon"
					onClick={handleLogout}
					className="text-muted-foreground hover:text-red-500 transition"
					title="Logout"
				>
					<LogOut className="w-5 h-5" />
				</Button>
			</div>

			{/* 🌙 Theme Toggle (top-right) */}
			<div className="absolute top-6 right-6 z-50">
				<ThemeToggle />
			</div>

			{/* 💬 Main content */}
			<div className="relative z-10 p-3 md:p-4 lg:p-8 min-h-screen flex flex-col bg-background/80 backdrop-blur-sm">
				<div className="max-w-4xl mx-auto flex-1 flex flex-col w-full">
					<div className="text-center mb-4 md:mb-8 animate-message-in">
						<div className="inline-flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
							<div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow">
								<div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center">
									<div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary" />
								</div>
							</div>
						</div>
						<h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 md:mb-4 tracking-tight px-4">
							Meet{" "}
							<span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
								Baymax
							</span>
						</h1>
						<p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
							Your personal healthcare companion powered by advanced AI.
							<br className="hidden md:block" />
							Caring, gentle, and always ready to help with your wellness needs.
						</p>
					</div>

					<div className="flex-1 max-w-4xl mx-auto w-full">
						<div className="h-[500px] md:h-[600px] lg:h-[700px]">
							<BaymaxChat
								className="h-full animate-message-in"
								style={{ animationDelay: "0.2s" }}
							/>
						</div>
					</div>

					<div
						className="text-center mt-4 md:mt-8 text-xs md:text-sm text-muted-foreground animate-message-in px-4"
						style={{ animationDelay: "0.4s" }}
					>
						<p className="opacity-75">
							Baymax is designed to be your caring digital healthcare companion.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Index;
