import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getTerms } from "@/actions/terms";
import { AppSidebar } from "@/components/app-sidebar";
import { HistoricTermBanner } from "@/components/historic-term-banner";
import { TermProvider } from "@/components/term-provider";
import type { Term } from "@/components/term-provider";
import { TermSelector } from "@/components/term-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const { terms: termsData } = await getTerms();
  const initialTerms: Term[] = termsData.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: new Date(t.startDate),
    endDate: new Date(t.endDate),
    isActive: t.isActive,
  }));

  return (
    <TermProvider initialTerms={initialTerms}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <TermSelector />
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 space-y-6 overflow-auto p-6">
            <HistoricTermBanner />
            <main>{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TermProvider>
  );
}
