import { Settings, Database, Tag, TrendingUp, Globe, Sliders, Activity, Palette, Sparkles, FolderOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const configItems = [
  { title: "Status das Fontes", url: "/config/status", icon: Activity },
  { title: "Grupos / Newsletters", url: "/config/groups", icon: FolderOpen },
  { title: "Fontes de Dados", url: "/config/sources", icon: Database },
  { title: "Palavras-chave", url: "/config/keywords", icon: Tag },
  { title: "Pesos por Editoria", url: "/config/weights", icon: TrendingUp },
  { title: "API Externa", url: "/config/external-api", icon: Globe },
  { title: "Automação", url: "/config/automation", icon: Sliders },
  { title: "Personalização", url: "/config/branding", icon: Palette },
  { title: "IA Newsletter", url: "/config/ai-newsletter", icon: Sparkles },
];

export function ConfigSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary/10 text-primary font-medium border-l-3 border-primary"
      : "hover:bg-brasis-beige/30 text-foreground/70 hover:text-foreground transition-colors";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-background">
        {/* Decorative brand stripe */}
        <div className="h-1 w-full brasis-pattern" />
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-xs uppercase tracking-widest text-primary/70 px-3 pt-4">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2">
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-sans text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}