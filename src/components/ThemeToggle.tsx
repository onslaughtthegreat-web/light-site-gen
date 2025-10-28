import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemeToggle: React.FC = () => {
	const [isDark, setIsDark] = useState(false);
	useEffect(() => {
		const savedTheme = localStorage.getItem("theme");

		if (savedTheme === "light") {
			setIsDark(false);
			document.documentElement.classList.remove("dark");
		} else {
			setIsDark(true);
			document.documentElement.classList.add("dark");
			if (!savedTheme) {
				localStorage.setItem("theme", "dark");
			}
		}
	}, []);

	const toggleTheme = () => {
		const newTheme = !isDark;
		setIsDark(newTheme);

		if (newTheme) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={toggleTheme}
			className={cn(
				"relative w-12 h-10 rounded-2xl border-2 transition-all duration-300",
				"bg-background/50 backdrop-blur-sm hover:shadow-glow",
				"border-border hover:border-primary/50"
			)}
		>
			<div className="relative w-full h-full flex items-center justify-center">
				<Sun
					className={cn(
						"w-4 h-4 transition-all duration-300 absolute",
						isDark
							? "opacity-0 scale-0 rotate-180"
							: "opacity-100 scale-100 rotate-0"
					)}
				/>
				<Moon
					className={cn(
						"w-4 h-4 transition-all duration-300 absolute",
						isDark
							? "opacity-100 scale-100 rotate-0"
							: "opacity-0 scale-0 -rotate-180"
					)}
				/>
			</div>
		</Button>
	);
};

export default ThemeToggle;
