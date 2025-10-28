import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/MatrixBackground";
import { cn } from "@/lib/utils";

const AuthPage = () => {
	const { isLoading, loginWithRedirect, isAuthenticated } = useAuth0();
	const [mode, setMode] = useState<"login" | "signup">("login");

	// Redirect if already authenticated
	React.useEffect(() => {
		if (isAuthenticated) {
			window.location.href = "/";
		}
	}, [isAuthenticated]);

	const handleAuth = () => {
		loginWithRedirect({
			authorizationParams: {
				screen_hint: mode === "signup" ? "signup" : undefined,
			},
		});
	};

	return (
		<div className="min-h-screen relative flex items-center justify-center bg-background overflow-hidden">
			<MatrixBackground />

			<div className="relative z-10 w-full max-w-md p-8 md:p-12 bg-background/80 backdrop-blur-xl rounded-3xl shadow-soft border border-border/50 flex flex-col items-center">
				{/* Mode Selector */}
				<div className="flex gap-2 mb-6 bg-background/30 p-1 rounded-xl border border-border/30">
					<button
						className={cn(
							"flex-1 py-2 rounded-xl font-semibold transition-all duration-300",
							mode === "login"
								? "bg-primary/20 text-primary-glow"
								: "text-muted-foreground hover:text-primary"
						)}
						onClick={() => setMode("login")}
					>
						Login
					</button>
					<button
						className={cn(
							"flex-1 py-2 rounded-xl font-semibold transition-all duration-300",
							mode === "signup"
								? "bg-primary/20 text-primary-glow"
								: "text-muted-foreground hover:text-primary"
						)}
						onClick={() => setMode("signup")}
					>
						Sign Up
					</button>
				</div>

				{/* Logo & Title */}
				<div className="mb-6 text-center">
					<div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow mx-auto mb-4">
						<div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center">
							<div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary" />
						</div>
					</div>
					<h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
						{mode === "login" ? "Welcome Back" : "Create Account"}{" "}
						<span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
							Baymax
						</span>
					</h1>
					<p className="mt-2 text-muted-foreground text-sm md:text-base">
						{mode === "login"
							? "Log in to continue with your personal healthcare companion."
							: "Sign up to start your journey with Baymax."}
					</p>
				</div>

				{/* Auth Button */}
				<Button
					onClick={handleAuth}
					className="w-full py-3 md:py-4 rounded-2xl text-lg md:text-xl font-semibold text-white gradient-baymax shadow-soft hover:shadow-glow hover:scale-105 transition-transform duration-300"
				>
					{isLoading ? "Loading..." : mode === "login" ? "Log In" : "Sign Up"}
				</Button>
			</div>
		</div>
	);
};

export default AuthPage;
