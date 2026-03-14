"use client";

import {
  Award,
  Calendar,
  ChartPie,
  ChevronDown,
  ClipboardList,
  FileText,
  History,
  Home,
  LogOut,
  Send,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient, useSession } from "@/lib/auth-client";

import Logo from "../../public/logo.svg";

const userNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Zgłoś punkty", url: "/dashboard/request", icon: Send },
  { title: "Moje zgłoszenia", url: "/dashboard/requests", icon: FileText },
  { title: "Historia punktów", url: "/dashboard/history", icon: History },
  { title: "Ranking", url: "/dashboard/ranking", icon: Trophy },
  { title: "Ustawienia", url: "/dashboard/settings", icon: Settings },
];

const moderatorNavItems = [
  { title: "Panel moderatora", url: "/moderator", icon: Shield },
  {
    title: "Oczekujące zgłoszenia",
    url: "/moderator/requests",
    icon: FileText,
  },
  { title: "Przydziel punkty", url: "/moderator/assign", icon: Award },
  { title: "Użytkownicy", url: "/moderator/users", icon: Users },
  { title: "Aktywności", url: "/moderator/activities", icon: ClipboardList },
  { title: "Statystyki", url: "/statistics", icon: ChartPie },
];

const adminNavItems = [
  { title: "Panel admina", url: "/admin", icon: Shield },
  { title: "Użytkownicy", url: "/admin/users", icon: Users },
  { title: "Aktywności", url: "/admin/activities", icon: ClipboardList },
  { title: "Punkty", url: "/admin/points", icon: Award },
  { title: "Semestry", url: "/admin/terms", icon: Calendar },
];

const handleSignOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/login";
      },
    },
  });
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setOpenMobile } = useSidebar();

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
  const role = (session?.user as any)?.role as string | undefined;
  const isModerator = role === "moderator" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="from-primary to-primary/60 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-md">
                <Image
                  src={Logo as StaticImageData}
                  alt="Samorząd W4N Logo"
                  className="size-6"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">Punkty samorządowe</span>
                <a
                  href="https://github.com/Antoni-Czaplicki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground text-xs hover:underline"
                >
                  by Antoni Czaplicki
                </a>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu główne</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    render={
                      <Link
                        href={item.url}
                        onClick={() => {
                          setOpenMobile(false);
                        }}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isModerator ? (
          <SidebarGroup>
            <SidebarGroupLabel>Moderator</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {moderatorNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      render={
                        <Link
                          href={item.url}
                          onClick={() => {
                            setOpenMobile(false);
                          }}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administracja</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      render={
                        <Link
                          href={item.url}
                          onClick={() => {
                            setOpenMobile(false);
                          }}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(triggerProps) => (
                  <SidebarMenuButton
                    {...triggerProps}
                    size="lg"
                    className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground group w-full"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={session?.user.image ?? ""}
                        alt={session?.user.name ?? ""}
                      />
                      <AvatarFallback className="rounded-lg">
                        {(session?.user.name ?? "CN").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session?.user.name ?? "Użytkownik"}
                      </span>
                      <span className="truncate text-xs">
                        {session?.user.email ?? ""}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-popup-open:rotate-180" />
                  </SidebarMenuButton>
                )}
              />
              <DropdownMenuContent
                className="w-(--anchor-width) min-w-56 rounded-lg"
                side="top"
                sideOffset={4}
              >
                <DropdownMenuItem
                  render={(itemProps) => (
                    <Link {...itemProps} href="/dashboard/settings">
                      <Settings className="mr-2 size-4" />
                      Ustawienia
                    </Link>
                  )}
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Wyloguj się
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
