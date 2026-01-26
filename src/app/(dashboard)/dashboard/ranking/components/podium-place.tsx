import { Crown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PodiumPlaceProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    totalPoints: number;
    _count: {
      pointsReceived: number;
    };
  } | null;
  position: 1 | 2 | 3;
}

export function PodiumPlace({ user, position }: PodiumPlaceProps) {
  if (user == null) {
    return <div className="w-full md:w-1/3" />;
  }

  const isWinner = position === 1;

  const podiumHeight = isWinner
    ? "md:h-72 md:hover:h-76 z-30"
    : position === 2
      ? "md:h-60 md:hover:h-64 z-20"
      : "md:h-48 md:hover:h-52 z-10";

  const avatarSize = isWinner ? "size-24 md:size-28" : "size-16 md:size-20";
  const avatarTextSize = isWinner
    ? "text-xl md:text-2xl"
    : "text-lg md:text-xl";

  const styles = isWinner
    ? {
        bg: "md:bg-gradient-to-b md:from-yellow-500/40 md:via-yellow-500/10 md:to-transparent md:border-yellow-500/60 md:shadow-[0_0_50px_-10px_rgba(234,179,8,0.4)]",
        text: "text-yellow-600 dark:text-yellow-500",
        badge:
          "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg shadow-yellow-500/25",
        ring: "ring-4 ring-yellow-500 shadow-xl shadow-yellow-500/20",
        number: "1",
        glow: "md:bg-yellow-500/20",
        trophyColor: "text-yellow-500",
      }
    : position === 2
      ? {
          bg: "md:bg-gradient-to-b md:from-slate-300/30 md:via-slate-300/5 md:to-transparent md:border-slate-300/40 md:shadow-[0_0_50px_-10px_rgba(203,213,225,0.3)]",
          text: "text-slate-500 dark:text-slate-300",
          badge:
            "bg-slate-200/50 text-slate-600 border-slate-300/50 dark:bg-slate-200/20 dark:text-slate-200 dark:border-slate-300/20",
          ring: "ring-2 ring-slate-300/50 shadow-lg",
          number: "2",
          glow: "md:bg-slate-400/10",
        }
      : {
          bg: "md:bg-gradient-to-b md:from-orange-700/30 md:via-orange-700/5 md:to-transparent md:border-orange-600/40 md:shadow-[0_0_50px_-10px_rgba(194,65,12,0.3)]",
          text: "text-orange-700 dark:text-orange-500",
          badge:
            "bg-orange-700/20 text-orange-700 dark:text-orange-500 border-orange-600/20",
          ring: "ring-2 ring-orange-600/50 shadow-lg",
          number: "3",
          glow: "md:bg-orange-600/10",
        };

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col items-center justify-end transition-all duration-300 ease-out group-hover:z-40 md:rounded-t-3xl md:border-x md:border-t",
        styles.bg,
        podiumHeight,
      )}
    >
      <div
        className={cn(
          "bg-radial-gradient absolute inset-0 from-white/5 to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-80 md:rounded-t-2xl",
          styles.glow,
        )}
      />

      <div className="z-20 flex flex-col items-center transition-transform duration-300 md:absolute md:-top-12">
        {isWinner ? (
          <div className="absolute -top-10 animate-bounce">
            <Crown className="size-8 fill-yellow-500 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] md:size-10" />
          </div>
        ) : null}
        <div className="relative">
          <Avatar
            className={cn(
              "shadow-2xl transition-transform group-hover:scale-105",
              avatarSize,
              styles.ring,
            )}
          >
            <AvatarFallback
              className={cn(
                "font-bold",
                avatarTextSize,
                isWinner
                  ? "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white"
                  : "bg-muted",
              )}
            >
              {user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() ?? user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-xs font-bold tracking-widest backdrop-blur-sm md:-bottom-4 md:px-3 md:py-1 md:text-sm",
              styles.badge,
            )}
          >
            #{position}
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center text-center md:mt-6">
          <p
            className={cn(
              "line-clamp-1 font-bold tracking-tight",
              isWinner ? "text-lg md:text-2xl" : "text-base md:text-lg",
              "text-foreground drop-shadow-md",
            )}
          >
            {user.name ?? user.email}
          </p>
          <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase opacity-80 md:text-xs">
            {user._count.pointsReceived}{" "}
            {user._count.pointsReceived === 1 ? "aktywność" : "aktywności"}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute bottom-0 hidden leading-none font-bold opacity-[0.03] select-none md:block",
          styles.text,
        )}
        style={{ fontSize: "clamp(6rem, 15vw, 10rem)" }}
      >
        {styles.number}
      </div>

      <div className="z-10 mb-6 hidden flex-col items-center gap-1 md:mb-8 md:flex">
        <span
          className={cn(
            "text-3xl font-black tracking-tighter tabular-nums drop-shadow-sm md:text-4xl",
            styles.text,
          )}
        >
          {user.totalPoints}
        </span>
        <span className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase opacity-70">
          Punktów
        </span>
      </div>
    </div>
  );
}
