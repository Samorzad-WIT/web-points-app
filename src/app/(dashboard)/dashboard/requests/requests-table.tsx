"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING": {
      return <Badge variant="secondary">Oczekujące</Badge>;
    }
    case "APPROVED": {
      return <Badge variant="default">Zatwierdzone</Badge>;
    }
    case "REJECTED": {
      return <Badge variant="destructive">Odrzucone</Badge>;
    }
    default: {
      return <Badge variant="outline">{status}</Badge>;
    }
  }
}

interface RequestItem {
  id: string;
  points: number;
  notes: string | null;
  status: string;
  rejectionComment?: string | null;
  createdAt: string | Date;
  activity: {
    name: string;
  };
  term: {
    name: string;
  };
}

export function RequestsTable({ requests }: { requests: RequestItem[] }) {
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aktywność</TableHead>
            <TableHead>Notatka</TableHead>
            <TableHead>Punkty</TableHead>
            <TableHead>Semestr</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Powód odrzucenia</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                {request.activity.name}
              </TableCell>
              <TableCell className="max-w-[200px]">
                {request.notes === null || request.notes === "" ? (
                  "-"
                ) : (
                  <Popover>
                    <PopoverTrigger
                      openOnHover
                      closeDelay={150}
                      className="block w-full cursor-pointer truncate text-left"
                    >
                      {request.notes}
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="max-h-64 w-80 overflow-y-auto break-words whitespace-pre-wrap"
                    >
                      {request.notes}
                    </PopoverContent>
                  </Popover>
                )}
              </TableCell>
              <TableCell>{request.points}</TableCell>
              <TableCell>{request.term.name}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                {request.status === "REJECTED" && request.rejectionComment ? (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-red-400 hover:underline"
                    onClick={() => {
                      setSelectedComment(request.rejectionComment ?? null);
                      setIsModalOpen(true);
                    }}
                  >
                    Zobacz powód
                  </Button>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(request.createdAt), "d MMM yyyy", {
                  locale: pl,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Powód odrzucenia zgłoszenia</DialogTitle>
          </DialogHeader>
          <div className="text-foreground py-4 text-sm whitespace-pre-wrap">
            {selectedComment}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
