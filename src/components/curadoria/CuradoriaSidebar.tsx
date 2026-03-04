import { CheckCircle, Edit3, BarChart3, FileText, User, Target, Lightbulb } from "lucide-react";
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
  { title: "Aprovação", url: "/curadoria/approval", icon: CheckCircle, description: "Revisar e aprovar conteúdos" },
  { title: "Newsletter", url: "/curadoria/newsletter", icon: FileText, description: "Exportar Newsletter Brasis" },
  { title: "Editor Social", url: "/curadoria/editor", icon: Edit3, description: "Criar conteúdo para redes sociais" },
  { title: "Editor Brasis", url: "/curadoria/brasis-editor", icon: Lightbulb, description: "Formato editorial Brasis" },
  { title: "Categorias", url: "/curadoria/categorias", icon: Target, description: "Gerenciar categorias de palavras-chave" },
  { title: "Persona & Estilo", url: "/curadoria/persona", icon: User, description: "Treinar estilo de escrita" },
  { title: "Voltar ao Radar", url: "/", icon: BarChart3, description: "Ver radar principal" },
];

export function CuradoriaSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary/10 text-primary font-semibold border-l-3 border-primary rounded-lg"
      : "text-sidebar-foreground hover:bg-muted/60 hover:text-primary transition-colors rounded-lg";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-sidebar pt-2">
        {/* Brasis branding stripe */}
        {!collapsed && (
          <div className="mx-3 mb-2 h-1 rounded-full brasis-pattern opacity-60" />
        )}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-xs uppercase tracking-wider text-muted-foreground">
            Fluxo de Edição
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {curadoriaItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-sans">{item.title}</span>
                          <span className="text-[11px] text-muted-foreground font-sans leading-tight">{item.description}</span>
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