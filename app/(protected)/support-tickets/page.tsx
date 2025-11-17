"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllSupportTickets,
  type SupportTicket,
  type SupportTicketsListResponse,
} from "@/lib/support-tickets-api";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import { formatDateOnlyIST } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

export default function SupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  const loadTickets = async (page: number = 0, status?: string) => {
    setLoading(true);
    try {
      const response: SupportTicketsListResponse = await getAllSupportTickets(
        page * ITEMS_PER_PAGE,
        ITEMS_PER_PAGE,
        status && status !== "all" ? (status as any) : undefined
      );
      setTickets(response.tickets);
      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);
    } catch (error: any) {
      toast.error(error.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets(currentPage, statusFilter);
  }, [currentPage, statusFilter]);


  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "IN_PROGRESS":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "WAITING_FOR_USER":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30";
      case "CLOSED":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30";
    }
  };

  const openTicketDetail = (ticket: SupportTicket) => {
    router.push(`/support-tickets/${ticket.id}`);
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-8">
          {/* Mobile: No outer card wrapper */}
          <div className="md:hidden mb-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Support Tickets</h1>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Mobile Card View - No outer card wrapper */}
          {loading ? (
            <div className="md:hidden flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="md:hidden py-12 text-center text-muted-foreground">
              No support tickets found
            </div>
          ) : (
            <div className="md:hidden space-y-4">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors p-4"
                  onClick={() => openTicketDetail(ticket)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-mono font-semibold text-lg mb-1">
                        {ticket.ticketNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateOnlyIST(ticket.createdAt)}
                      </div>
                    </div>
                    <Badge className={`${getStatusBadgeStyle(ticket.status)} border`}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">User</div>
                      <div className="font-medium text-sm">{ticket.userEmail}</div>
                      <div className="text-sm text-muted-foreground">
                        {ticket.userMobile}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Subject</div>
                      <div className="text-sm">
                        {ticket.subject || (
                          <span className="text-muted-foreground italic">
                            No subject
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTicketDetail(ticket);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Desktop: Card wrapper with table */}
          <Card className="hidden md:block p-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Support Tickets</h1>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No support tickets found
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow 
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openTicketDetail(ticket)}
                        >
                          <TableCell className="font-mono font-medium">
                            {ticket.ticketNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticket.userEmail}</div>
                              <div className="text-sm text-muted-foreground">
                                {ticket.userMobile}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {ticket.subject || (
                              <span className="text-muted-foreground italic">
                                No subject
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadgeStyle(ticket.status)} border`}>
                              {ticket.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDateOnlyIST(ticket.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTicketDetail(ticket);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {tickets.length} of {totalCount} tickets
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!hasMore}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
          {/* Mobile pagination outside card */}
          {!loading && tickets.length > 0 && (
            <div className="md:hidden mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {tickets.length} of {totalCount} tickets
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!hasMore}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

