// AuthPage.tsx
import React, { useState } from "react";
import { login, signup } from "@/lib/groq-api";
import MatrixBackground from "@/components/MatrixBackground"; // import Matrix rain

const AuthPage: React.FC = () => {
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setLoading(true);

		try {
			if (mode === "signup") {
				await signup(username, password);
				setSuccess("Signup successful!");
				window.location.reload();
			} else {
				await login(username, password);
				setSuccess("Login successful!");
				window.location.reload();
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen flex items-center justify-center">
			{/* Matrix background */}
			<MatrixBackground />

			{/* Auth form */}
			<div className="relative w-full max-w-md bg-black/80 p-8 rounded shadow z-10">
				<h2 className="text-2xl font-bold mb-6 text-center text-green-400">
					{mode === "login" ? "Login" : "Sign Up"}
				</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block mb-1 font-medium text-green-300">
							Username
						</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full border px-3 py-2 rounded bg-black text-green-200 border-green-700"
							required
						/>
					</div>
					<div>
						<label className="block mb-1 font-medium text-green-300">
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full border px-3 py-2 rounded bg-black text-green-200 border-green-700"
							required
						/>
					</div>
					<button
						type="submit"
						className="w-full bg-green-600 text-black py-2 rounded hover:bg-green-500 transition font-bold"
						disabled={loading}
					>
						{loading
							? mode === "login"
								? "Logging in..."
								: "Signing up..."
							: mode === "login"
							? "Login"
							: "Sign Up"}
					</button>
				</form>

				{error && <p className="text-red-500 mt-3">{error}</p>}
				{success && <p className="text-green-400 mt-3">{success}</p>}

				<p className="mt-6 text-center text-sm text-green-300">
					{mode === "login"
						? "Don't have an account?"
						: "Already have an account?"}{" "}
					<button
						className="text-green-400 underline"
						onClick={() => {
							setMode(mode === "login" ? "signup" : "login");
							setError(null);
							setSuccess(null);
						}}
					>
						{mode === "login" ? "Sign Up" : "Login"}
					</button>
				</p>
			</div>
		</div>
	);
};

export default AuthPage;
