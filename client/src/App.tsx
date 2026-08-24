import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Cameras from "@/pages/Cameras";
import CameraDetail from "@/pages/CameraDetail";
import CommandCenter from "@/pages/CommandCenter";
import DatasetGallery from "@/pages/DatasetGallery";
import Exports from "@/pages/Exports";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <DashboardLayout>
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
