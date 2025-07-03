import { Eye, CheckCircle, Edit3, BarChart3 } from "lucide-react";
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

const curadoriaItems = [
  { title: "Revisão", url: "/curadoria/review", icon: Eye, description: "Revisar conteúdos coletados" },
  { title: "Aprovação", url: "/curadoria/approval", icon: CheckCircle, description: "Aprovar para radar ou edição" },
  { title: "Editor", url: "/curadoria/editor", icon: Edit3, description: "Criar conteúdo para redes sociais" },
  { title: "Voltar ao Radar", url: "/", icon: BarChart3, description: "Ver radar principal" },
];

export function CuradoriaSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Fluxo de Curadoria</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {curadoriaItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      )}
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