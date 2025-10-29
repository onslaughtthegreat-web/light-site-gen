import React, { useEffect, useRef } from "react";

export default function MatrixBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const chars = "01".split("");
		const fontSize = 14;
		let columns = 0;
		let drops: number[] = [];

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			columns = Math.floor(canvas.width / fontSize);
			drops = Array.from(
				{ length: columns },
				() => (Math.random() * canvas.height) / fontSize
			);
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		const draw = () => {
			ctx.fillStyle = "rgba(15, 23, 42, 0.05)"; // background fade
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "#0f0"; // matrix green
			ctx.font = fontSize + "px monospace";

			for (let i = 0; i < drops.length; i++) {
				const text = chars[Math.floor(Math.random() * chars.length)];
				ctx.fillText(text, i * fontSize, drops[i] * fontSize);

				if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
					drops[i] = 0;
				}
				drops[i]++;
			}
		};

		const interval = setInterval(draw, 35);

		return () => {
			clearInterval(interval);
			window.removeEventListener("resize", resizeCanvas);
		};
	}, []);

	return (
		<canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
	);
}
