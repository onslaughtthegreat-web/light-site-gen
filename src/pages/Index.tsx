import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">Simple Site</h1>
        <p className="text-xl text-muted-foreground">
          Clean, minimal, and elegant
        </p>
        <Button size="lg">Get Started</Button>
      </div>
    </main>
  );
};

export default Index;
