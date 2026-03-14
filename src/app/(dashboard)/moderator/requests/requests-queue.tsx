"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  approvePointRequest,
  rejectPointRequest,
} from "@/actions/point-requests";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface PointRequest {
  id: string;
  points: number;
  notes: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  activity: { id: string; name: string };
  term: { id: string; name: string };
}

interface RequestsQueueProps {
  requests: PointRequest[];
  currentUserId?: string;
}

export function RequestsQueue({ requests, currentUserId }: RequestsQueueProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectNote, setRejectNote] = useState("");
  const [modifyPoints, setModifyPoints] = useState<Record<string, number>>({});

  const handleApprove = (requestId: string, originalPoints: number) => {
    const finalPoints = modifyPoints[requestId] ?? originalPoints;
    startTransition(async () => {
      const result = await approvePointRequest(requestId, finalPoints);
      if (result.error === undefined) {
        toast.success("Zgłoszenie zostało zatwierdzone");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReject = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectPointRequest(
        requestId,
        rejectNote || undefined,
      );
      if (result.error === undefined) {
        toast.success("Zgłoszenie zostało odrzucone");
        setRejectNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (requests.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Brak oczekujących zgłoszeń. Wszystko jest na bieżąco! 🎉
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Użytkownik</TableHead>
          <TableHead>Aktywność</TableHead>
          <TableHead>Punkty</TableHead>
          <TableHead>Notatka</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="w-[120px]">Akcje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div className="flex flex-col">
                <Link
                  href={`/admin/users/${request.user.id}`}
                  className="w-fit font-medium hover:underline"
                >
                  {request.user.name}
                </Link>
                <div className="text-muted-foreground text-xs">
                  {request.user.email}
                </div>
              </div>
            </TableCell>
            <TableCell>{request.activity.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="h-8 w-20"
                  defaultValue={request.points}
                  onChange={(event_) => {
                    const value = Number.parseInt(event_.target.value, 10);
                    if (!Number.isNaN(value)) {
                      setModifyPoints((previous) => ({
                        ...previous,
                        [request.id]: value,
                      }));
                    }
                  }}
                  min={1}
                />
                {request.id in modifyPoints ? (
                  <span className="text-muted-foreground text-xs">
                    (było: {request.points})
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {request.notes ?? "-"}
            </TableCell>
            <TableCell>
              {format(new Date(request.createdAt), "d MMM yyyy", {
                locale: pl,
              })}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700 disabled:opacity-50"
                  onClick={() => {
                    handleApprove(request.id, request.points);
                  }}
                  disabled={isPending || request.user.id === currentUserId}
                  title={
                    request.user.id === currentUserId
                      ? "Nie możesz zatwierdzić własnego zgłoszenia"
                      : "Zatwierdź"
                  }
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        disabled={
                          isPending || request.user.id === currentUserId
                        }
                        title={
                          request.user.id === currentUserId
                            ? "Nie możesz odrzucić własnego zgłoszenia"
                            : "Odrzuć"
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Odrzuć zgłoszenie</DialogTitle>
                      <DialogDescription>
                        Czy na pewno chcesz odrzucić to zgłoszenie? Możesz dodać
                        powód odrzucenia.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="reject-note">Powód odrzucenia</Label>
                      <Textarea
                        id="reject-note"
                        placeholder="Powód odrzucenia (opcjonalnie)"
                        value={rejectNote}
                        onChange={(event_) => {
                          setRejectNote(event_.target.value);
                        }}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose
                        render={<Button variant="outline">Anuluj</Button>}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleReject(request.id);
                        }}
                        disabled={isPending}
                      >
                        Odrzuć
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
