import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import Dashboard from "@/pages/Dashboard";
import Tracker from "@/pages/Tracker";
import Projects from "@/pages/Projects";
import NewProject from "@/pages/NewProject";
import Clients from "@/pages/Clients";
import NewClient from "@/pages/NewClient";
import Team from "@/pages/Team";
import NewTeamMember from "@/pages/NewTeamMember";
import EditTeamMember from "@/pages/EditTeamMember";
import AssignProjects from "@/pages/AssignProjects";
import NewGroup from "@/pages/NewGroup";
import Reports from "@/pages/Reports";
import ReportDetail from "@/pages/ReportDetail";
import TimeSummaryReport from "@/pages/TimeSummaryReport";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ 
  component: Component, 
  permission 
}: { 
  component: React.ComponentType, 
  permission?: keyof ReturnType<typeof usePermissions> 
}) {
  const permissions = usePermissions();
  
  if (permission && !permissions[permission]) {
    return <Redirect to="/tracker" />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} permission="canAccessDashboard" />}
      </Route>
      <Route path="/tracker" component={Tracker} />
      <Route path="/projects">
        {() => <ProtectedRoute component={Projects} permission="canAccessProjects" />}
      </Route>
      <Route path="/projects/new">
        {() => <ProtectedRoute component={NewProject} permission="canAccessProjects" />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={Clients} permission="canAccessClients" />}
      </Route>
      <Route path="/clients/new">
        {() => <ProtectedRoute component={NewClient} permission="canAccessClients" />}
      </Route>
      <Route path="/team">
        {() => <ProtectedRoute component={Team} permission="canAccessTeam" />}
      </Route>
      <Route path="/team/new">
        {() => <ProtectedRoute component={NewTeamMember} permission="canAccessTeam" />}
      </Route>
      <Route path="/team/edit/:id">
        {() => <ProtectedRoute component={EditTeamMember} permission="canAccessTeam" />}
      </Route>
      <Route path="/team/assign-projects/:id">
        {() => <ProtectedRoute component={AssignProjects} permission="canAccessTeam" />}
      </Route>
      <Route path="/team/groups/new">
        {() => <ProtectedRoute component={NewGroup} permission="canAccessTeam" />}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute component={Reports} permission="canAccessReports" />}
      </Route>
      <Route path="/reports/time-summary">
        {() => <ProtectedRoute component={TimeSummaryReport} permission="canAccessReports" />}
      </Route>
      <Route path="/reports/:id">
        {() => <ProtectedRoute component={ReportDetail} permission="canAccessReports" />}
      </Route>
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading, canAccessDashboard } = usePermissions();
  const isLoginPage = location === "/login";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoginPage) {
    return <Redirect to="/login" />;
  }

  if (isAuthenticated && isLoginPage) {
    return <Redirect to={canAccessDashboard ? "/" : "/tracker"} />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoginPage) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-2 border-b gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <WorkspaceSelector />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WorkspaceProvider>
            <AppContent />
          </WorkspaceProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
