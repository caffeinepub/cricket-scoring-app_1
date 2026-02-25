import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import MatchHistory from "@/pages/MatchHistory";
import Teams from "@/pages/Teams";
import MatchSetup from "@/pages/MatchSetup";
import LiveScoring from "@/pages/LiveScoring";
import Scorecard from "@/pages/Scorecard";
import Rules from "@/pages/Rules";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Root route with Layout as the shell
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Outlet />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  ),
});

// Index / Home route → MatchHistory
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MatchHistory,
});

// History route
const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: MatchHistory,
});

// Teams route
const teamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams",
  component: Teams,
});

// Match Setup route
const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: MatchSetup,
});

// Live Scoring route (path param)
const liveMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/match/$matchId",
  component: LiveScoring,
});

// Live Scoring route (search param fallback)
const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: LiveScoring,
});

// Scorecard route (path param)
const scorecardMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scorecard/$matchId",
  component: Scorecard,
});

// Scorecard route (search param fallback)
const scorecardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scorecard",
  component: Scorecard,
});

// Rules route
const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: Rules,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  historyRoute,
  teamsRoute,
  setupRoute,
  liveMatchRoute,
  liveRoute,
  scorecardMatchRoute,
  scorecardRoute,
  rulesRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
