import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Archive, Camera, Gauge, GalleryVerticalEnd, LayoutDashboard, LogIn, LogOut, PanelLeft, Radar, Settings2 } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: Radar, label: "Command center", path: "/command-center" },
  { icon: Camera, label: "Camera registry", path: "/cameras" },
  { icon: GalleryVerticalEnd, label: "Dataset gallery", path: "/dataset" },
  { icon: Archive, label: "Exports", path: "/exports" },
  { icon: Settings2, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "atcs-vision-sidebar-width";
const DEFAULT_WIDTH = 276;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children, demoMode = false }: { children: React.ReactNode; demoMode?: boolean }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading } = useAuth();

  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);
  if (loading && !demoMode) return <DashboardLayoutSkeleton />;

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent demoMode={demoMode} setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, demoMode, setSidebarWidth }: { children: React.ReactNode; demoMode: boolean; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => location === item.path || (item.path === "/cameras" && location.startsWith("/cameras/")));
  const isGuest = !user;
  const displayName = user?.name || "Guest";
  const identityDetail = demoMode ? "Front-end preview" : isGuest ? "Mode baca publik" : user?.email || "Administrator";

  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => { if (!isResizing) return; const left = sidebarRef.current?.getBoundingClientRect().left ?? 0; const width = event.clientX - left; if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [isResizing, setSidebarWidth]);

  const adjustSidebarWidth = (delta: number) => {
    const currentWidth = sidebarRef.current?.getBoundingClientRect().width ?? DEFAULT_WIDTH;
    setSidebarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, currentWidth + delta)));
  };

  return <><a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-lime-950 focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-stone-950">Lewati navigasi ke konten utama</a><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="border-r-0 bg-[#16332e] text-white" disableTransition={isResizing}><SidebarHeader className="h-[86px] justify-center px-3"><div className="flex w-full items-center gap-3"><button onClick={toggleSidebar} aria-label="Buka atau tutup navigasi" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-lime-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed ? <div className="flex min-w-0 items-center gap-2.5"><span aria-hidden="true" className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-lime-200/20 bg-lime-300/10"><i className="absolute h-5 w-px bg-lime-200/75" /><i className="absolute h-px w-5 bg-lime-200/75" /><i className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_0_4px_rgba(190,242,100,0.12)]" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">ATCS / vision</p><p className="mt-0.5 truncate text-sm font-semibold tracking-tight text-white">Dataset workspace</p></div></div> : null}</div></SidebarHeader><SidebarContent className="gap-0 px-3"><p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-200/55 group-data-[collapsible=icon]:hidden">Workspace</p><SidebarMenu>{menuItems.map((item) => { const isActive = location === item.path || (item.path === "/cameras" && location.startsWith("/cameras/")); return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} aria-current={isActive ? "page" : undefined} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-xl px-3 text-stone-300 transition-colors hover:bg-white/10 hover:text-white data-[active=true]:bg-lime-300 data-[active=true]:text-lime-950"><item.icon className="h-4 w-4" /><span className="font-medium">{item.label}</span></SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu><div className="mt-7 rounded-xl border border-white/10 bg-white/[0.04] p-3 group-data-[collapsible=icon]:hidden"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{isGuest ? "Akses publik" : "Pipeline status"}</p><div className="mt-2 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${isGuest ? "bg-sky-300" : "bg-amber-400"}`} /><span className="text-xs font-medium text-stone-200">{isGuest ? "Guest · lihat saja" : "Capture standby"}</span></div><p className="mt-2 text-[11px] leading-4 text-stone-400">{isGuest ? "Masuk sebagai admin untuk mengubah konfigurasi, garis, model, atau capture." : "Lengkapi source camera untuk mulai mengumpulkan dataset."}</p></div></SidebarContent><SidebarFooter className="p-3"><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"><Avatar className="h-8 w-8 shrink-0 border border-white/10"><AvatarFallback className="bg-lime-200 text-xs font-bold text-lime-950">{displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>{!isCollapsed ? <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{displayName}</p><p className="mt-0.5 truncate text-[10px] text-stone-400">{identityDetail}</p></div> : null}{!demoMode && !isCollapsed ? isGuest ? <button aria-label="Masuk sebagai admin" onClick={() => startLogin()} className="text-stone-400 hover:text-white"><LogIn className="h-4 w-4" /></button> : <button aria-label="Keluar" onClick={logout} className="text-stone-400 hover:text-white"><LogOut className="h-4 w-4" /></button> : null}</div></SidebarFooter></Sidebar><div role="separator" aria-label="Ubah lebar navigasi" aria-orientation="vertical" tabIndex={isCollapsed ? -1 : 0} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); adjustSidebarWidth(16); } if (event.key === "ArrowLeft") { event.preventDefault(); adjustSidebarWidth(-16); } }} className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-lime-300/40 focus:w-2 focus:bg-lime-300/70 focus:outline-none ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} style={{ zIndex: 50 }} /></div><SidebarInset className="bg-[#f7f7f3]">{isMobile ? <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-stone-200 bg-[#f7f7f3]/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-xl border border-stone-200 bg-white" /><span className="text-sm font-semibold text-stone-800">{activeMenuItem?.label || "ATCS Vision"}</span></div> : null}<main id="main-content" tabIndex={-1} className="flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">{children}</main></SidebarInset></>;
}
