import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import Layout from './components/Layout';
import MatchSetup from './pages/MatchSetup';
import LiveScoring from './pages/LiveScoring';
import Scorecard from './pages/Scorecard';
import MatchHistory from './pages/MatchHistory';
import Teams from './pages/Teams';
import Rules from './pages/Rules';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MatchHistory,
});

const matchSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup',
  component: MatchSetup,
});

const liveScoringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/match/$matchId',
  component: LiveScoring,
});

const scorecardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scorecard/$matchId',
  component: Scorecard,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: MatchHistory,
});

const teamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teams',
  component: Teams,
});

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rules',
  component: Rules,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  matchSetupRoute,
  liveScoringRoute,
  scorecardRoute,
  historyRoute,
  teamsRoute,
  rulesRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
