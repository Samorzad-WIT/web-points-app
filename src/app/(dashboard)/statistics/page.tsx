import { TrendingUp } from "lucide-react";

import { getStatistics } from "@/actions/statistics";
import { DashboardHeader } from "@/components/dashboard-header";
import { prisma } from "@/lib/prisma";

import {
  ActivitiesPieChart,
  DailyActivityChart,
  KpiStatsCards,
  PointsOverTimeChart,
  RecentActivityList,
  TopActivitiesChart,
  TopAssignersChart,
  TopUsersChart,
} from "./charts";

interface PageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function StatisticsPage({ searchParams }: PageProps) {
  const { termId } = await searchParams;

  let effectiveTermId = termId;
  if (effectiveTermId === undefined) {
    const activeTerm = await prisma.term.findFirst({
      where: { isActive: true },
    });

    if (activeTerm === null) {
      const latestTerm = await prisma.term.findFirst({
        orderBy: { startDate: "desc" },
      });
      effectiveTermId = latestTerm?.id;
    } else {
      effectiveTermId = activeTerm.id;
    }
  }

  const stats = await getStatistics(effectiveTermId);

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Statystyki"
        text="Kompleksowa analiza danych i aktywności w systemie"
        icon={TrendingUp}
      />

      <KpiStatsCards
        totalPoints={stats.totalPoints}
        totalAssignments={stats.totalAssignments}
        totalUsers={stats.totalUsers}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="col-span-4 select-none">
          <PointsOverTimeChart data={stats.pointsOverTime} />
        </div>

        <div className="col-span-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="select-none lg:col-span-1">
            <ActivitiesPieChart data={stats.activitiesPieData} />
          </div>
          <div className="select-none lg:col-span-2">
            <RecentActivityList data={stats.recentAssignments} />
          </div>
        </div>

        <div className="col-span-4 grid grid-cols-1 gap-6 select-none lg:grid-cols-3">
          <TopUsersChart data={stats.topUsersData} />
          <TopActivitiesChart data={stats.topActivitiesData} />
          <TopAssignersChart data={stats.topAssignersData} />
        </div>

        <div className="col-span-4 select-none">
          <DailyActivityChart data={stats.dailyActivityData} />
        </div>
      </div>
    </div>
  );
}
