import { BarChart3, Briefcase, Clock, FolderOpen, Settings, Users, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

const allMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    testId: "link-dashboard",
    permission: "canAccessDashboard" as const,
  },
  {
    title: "Tracker",
    url: "/tracker",
    icon: Clock,
    testId: "link-tracker",
    permission: "canAccessTracker" as const,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
    testId: "link-projects",
    permission: "canAccessProjects" as const,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Briefcase,
    testId: "link-clients",
    permission: "canAccessClients" as const,
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
    testId: "link-team",
    permission: "canAccessTeam" as const,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    testId: "link-reports",
    permission: "canAccessReports" as const,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    testId: "link-settings",
    permission: "canAccessSettings" as const,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const permissions = usePermissions();

  const menuItems = allMenuItems.filter(item => permissions[item.permission]);

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.name || user?.email || 'User';
  const roleLabel = permissions.isOwner ? 'Owner' : permissions.isAdmin ? 'Admin' : permissions.isManager ? 'Manager' : 'Member';
  
  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Focus Flow</h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md p-2 hover-elevate" data-testid="button-user-menu">
              <Avatar className="h-8 w-8">
                {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left text-sm">
                <p className="font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" data-testid="menu-settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
