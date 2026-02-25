import { Outlet } from "@tanstack/react-router";
import BottomTabNavigation from "@/components/BottomTabNavigation";

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src="/assets/generated/cricket-logo.dim_256x256.png"
            alt="Cricket Logo"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">
              Cricket Scorer
            </h1>
            <p className="text-xs opacity-75">Live Match Management</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-24">
        {children ?? <Outlet />}
      </main>

      {/* Bottom Navigation */}
      <BottomTabNavigation />

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground text-center text-xs py-3 pb-20">
        <p>
          Built with{" "}
          <span className="text-accent" aria-label="love">
            ♥
          </span>{" "}
          using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined"
                ? window.location.hostname
                : "cricket-scorer"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            caffeine.ai
          </a>
        </p>
        <p className="opacity-60 mt-1">
          © {new Date().getFullYear()} Cricket Scorer
        </p>
      </footer>
    </div>
  );
}
