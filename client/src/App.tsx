import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import { Redirect, Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Cameras = lazy(() => import("@/pages/Cameras"));
const CameraDetail = lazy(() => import("@/pages/CameraDetail"));
const CommandCenter = lazy(() => import("@/pages/CommandCenter"));
const DatasetGallery = lazy(() => import("@/pages/DatasetGallery"));
const Exports = lazy(() => import("@/pages/Exports"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteLoading() {
  return <div className="mx-auto flex min-h-[420px] max-w-[1500px] items-center justify-center rounded-[1.5rem] border border-stone-200 bg-white text-sm font-medium text-stone-500">Memuat ruang kerja…</div>;
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<RouteLoading />}>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/command-center"} component={CommandCenter} />
          <Route path={"/cameras/:cameraId"} component={CameraDetail} />
          <Route path={"/cameras"} component={Cameras} />
          <Route path={"/dataset"} component={DatasetGallery} />
          <Route path={"/exports"} component={Exports} />
          <Route path={"/settings"} component={Settings} />
          <Route path={"/404"} component={NotFound} />
          <Route>
            <Redirect to="/" replace />
          </Route>
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
