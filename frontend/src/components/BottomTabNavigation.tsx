import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, PlayCircle, BookOpen } from "lucide-react";

const tabs = [
  { label: "History", icon: Home, to: "/" },
  { label: "Teams", icon: Users, to: "/teams" },
  { label: "Setup", icon: PlayCircle, to: "/setup" },
  { label: "Rules", icon: BookOpen, to: "/rules" },
];

export default function BottomTabNavigation() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary/20 shadow-lg">
      <div className="max-w-2xl mx-auto flex">
        {tabs.map(({ label, icon: Icon, to }) => {
          const isActive =
            to === "/"
              ? currentPath === "/" || currentPath === "/history"
              : currentPath.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-primary-foreground/60 hover:text-primary-foreground"
              }`}
            >
              <Icon
                size={20}
                className={isActive ? "text-accent" : ""}
              />
              <span className="text-xs font-medium">{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-accent rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
