"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getAllSupportTickets,
  type SupportTicket,
  type SupportTicketsListResponse,
} from "@/lib/support-tickets-api";
import { toast } from "sonner";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, User, Users, Ticket, MessageSquare, Clock, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import { formatDateOnlyIST } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

type SortField = "createdAt" | "updatedAt" | "ticketNumber" | "status";
type SortOrder = "asc" | "desc";
type TabValue = "assigned" | "all";

export default function SupportTicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read initial state from URL parameters
  const getInitialTab = (): TabValue => {
    const tab = searchParams.get("tab");
    return tab === "all" ? "all" : "assigned";
  };
  
  const getInitialPage = (): number => {
    const page = searchParams.get("page");
    return page ? Math.max(0, parseInt(page, 10) - 1) : 0;
  };
  
  const getInitialStatus = (): string => {
    const status = searchParams.get("status");
    return status || "all";
  };
  
  const getInitialSortBy = (): SortField => {
    const sort = searchParams.get("sortBy");
    if (sort === "updatedAt" || sort === "ticketNumber" || sort === "status") {
      return sort;
    }
    return "createdAt";
  };
  
  const getInitialSortOrder = (): SortOrder => {
    const order = searchParams.get("sortOrder");
    return order === "asc" ? "asc" : "desc";
  };

  const [activeTab, setActiveTab] = useState<TabValue>(getInitialTab);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(getInitialStatus);
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [sortBy, setSortBy] = useState<SortField>(getInitialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialSortOrder);

  // Counts for tab badges
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [allCount, setAllCount] = useState<number>(0);

  // Update URL when state changes
  const updateURL = useCallback((
    tab: TabValue,
    page: number,
    status: string,
    sort: SortField,
    order: SortOrder
  ) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (page > 0) params.set("page", (page + 1).toString());
    if (status !== "all") params.set("status", status);
    if (sort !== "createdAt") params.set("sortBy", sort);
    if (order !== "desc") params.set("sortOrder", order);
    
    const queryString = params.toString();
    const newUrl = queryString ? `/support-tickets?${queryString}` : "/support-tickets";
    router.replace(newUrl, { scroll: false });
  }, [router]);

  const handleSort = (field: SortField) => {
    const newOrder = sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc";
    const newSortBy = field;
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    setCurrentPage(0);
    updateURL(activeTab, 0, statusFilter, newSortBy, newOrder);
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const loadTickets = async (
    page: number = 0,
    status?: string,
    sortByField?: SortField,
    sortOrderValue?: SortOrder,
    tab?: TabValue
  ) => {
    setLoading(true);
    try {
      // Determine assignedTo filter based on tab
      const assignedTo = tab === "assigned" ? "me" : undefined;
      
      const response: SupportTicketsListResponse = await getAllSupportTickets(
        page * ITEMS_PER_PAGE,
        ITEMS_PER_PAGE,
        status && status !== "all" ? (status as any) : undefined,
        sortByField,
        sortOrderValue,
        assignedTo
      );
      setTickets(response.tickets || []);
      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);

      // Update count for current tab
      if (tab === "assigned") {
        setAssignedCount(response.totalCount);
      } else {
        setAllCount(response.totalCount);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  // Load counts for both tabs on initial mount
  const loadCounts = async () => {
    try {
      // Get assigned count
      const assignedResponse = await getAllSupportTickets(0, 1, undefined, undefined, undefined, "me");
      setAssignedCount(assignedResponse.totalCount);

      // Get all count
      const allResponse = await getAllSupportTickets(0, 1, undefined, undefined, undefined, undefined);
      setAllCount(allResponse.totalCount);
    } catch (error) {
      // Silently fail - counts are not critical
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    loadTickets(currentPage, statusFilter, sortBy, sortOrder, activeTab);
  }, [currentPage, statusFilter, sortBy, sortOrder, activeTab]);

  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    setActiveTab(newTab);
    setCurrentPage(0);
    updateURL(newTab, 0, statusFilter, sortBy, sortOrder);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
    updateURL(activeTab, 0, value, sortBy, sortOrder);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURL(activeTab, newPage, statusFilter, sortBy, sortOrder);
  };


  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "IN_PROGRESS":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "WAITING_FOR_USER":
        return "bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30";
      case "CLOSED":
        return "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-3 w-3" />;
      case "IN_PROGRESS":
        return <Clock className="h-3 w-3" />;
      case "WAITING_FOR_USER":
        return <MessageSquare className="h-3 w-3" />;
      case "CLOSED":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Open";
      case "IN_PROGRESS":
        return "In Progress";
      case "WAITING_FOR_USER":
        return "Waiting";
      case "CLOSED":
        return "Closed";
      default:
        return status;
    }
  };

  const openTicketDetail = (ticket: SupportTicket) => {
    // Build return URL with current state
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (currentPage > 0) params.set("page", (currentPage + 1).toString());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    
    const returnUrl = params.toString() ? `/support-tickets?${params.toString()}` : "/support-tickets";
    router.push(`/support-tickets/${ticket.id}?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  // Render ticket card for mobile view
  const renderMobileTicketCard = (ticket: SupportTicket) => (
    <Card
      key={ticket.id}
      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 p-4 border-l-4"
      style={{
        borderLeftColor: ticket.status === "OPEN" ? "rgb(16 185 129)" : 
                         ticket.status === "IN_PROGRESS" ? "rgb(245 158 11)" :
                         ticket.status === "WAITING_FOR_USER" ? "rgb(139 92 246)" : 
                         "rgb(100 116 139)"
      }}
      onClick={() => openTicketDetail(ticket)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="font-mono font-semibold text-lg">{ticket.ticketNumber}</span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDateOnlyIST(ticket.createdAt)}
          </div>
        </div>
        <Badge className={`${getStatusBadgeStyle(ticket.status)} border flex items-center gap-1`}>
          {getStatusIcon(ticket.status)}
          {formatStatus(ticket.status)}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="font-medium text-sm">{ticket.userEmail}</div>
          <div className="text-sm text-muted-foreground">
            {ticket.userMobile}
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium">
            {ticket.subject || (
              <span className="text-muted-foreground italic">
                No subject
              </span>
            )}
          </div>
        </div>

        {ticket.assignedToEmail && (
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">
              {ticket.assignedToEmail}
            </span>
          </div>
        )}
      </div>
    </Card>
  );

  // Render ticket row for desktop table
  const renderTicketRow = (ticket: SupportTicket) => (
    <TableRow 
      key={ticket.id}
      className="cursor-pointer hover:bg-muted/50 transition-all duration-150 group"
      onClick={() => openTicketDetail(ticket)}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <div 
            className="w-1 h-8 rounded-full"
            style={{
              backgroundColor: ticket.status === "OPEN" ? "rgb(16 185 129)" : 
                               ticket.status === "IN_PROGRESS" ? "rgb(245 158 11)" :
                               ticket.status === "WAITING_FOR_USER" ? "rgb(139 92 246)" : 
                               "rgb(100 116 139)"
            }}
          />
          <span className="font-mono font-semibold text-primary">{ticket.ticketNumber}</span>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{ticket.userEmail}</div>
          <div className="text-sm text-muted-foreground">
            {ticket.userMobile}
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-[300px]">
        <span className="line-clamp-2">
          {ticket.subject || (
            <span className="text-muted-foreground italic">
              No subject
            </span>
          )}
        </span>
      </TableCell>
      <TableCell>
        <Badge className={`${getStatusBadgeStyle(ticket.status)} border flex items-center gap-1 w-fit`}>
          {getStatusIcon(ticket.status)}
          {formatStatus(ticket.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {ticket.assignedToEmail ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm font-medium">{ticket.assignedToEmail.split('@')[0]}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic text-sm">Unassigned</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDateOnlyIST(ticket.createdAt)}
      </TableCell>
    </TableRow>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Ticket className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {activeTab === "assigned" 
          ? "No tickets assigned to you" 
          : "No support tickets found"}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        {activeTab === "assigned" 
          ? "When tickets are assigned to you, they will appear here." 
          : "There are no support tickets matching your current filters."}
      </p>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-sm">Loading tickets...</p>
    </div>
  );

  // Render pagination
  const renderPagination = () => (
    <div className="mt-6 flex items-center justify-between border-t pt-4">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{tickets.length}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span> tickets
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 0}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  // Render status filter
  const renderStatusFilter = () => (
    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
  );

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-8">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Page Header with Tabs inline */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-semibold">Support Tickets</h1>
                </div>
                <TabsList className="hidden sm:grid grid-cols-2 bg-muted/50">
                  <TabsTrigger value="assigned" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <User className="h-4 w-4" />
                    <span>Assigned to Me</span>
                    {assignedCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-background/50">
                        {assignedCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Users className="h-4 w-4" />
                    <span>All Tickets</span>
                    {allCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-background/50">
                        {allCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                {renderStatusFilter()}
              </div>
            </div>

            {/* Mobile Tabs - shown below title on small screens */}
            <TabsList className="grid w-full grid-cols-2 sm:hidden mb-4 bg-muted/50">
              <TabsTrigger value="assigned" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="h-4 w-4" />
                <span>Assigned to Me</span>
                {assignedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {assignedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4" />
                <span>All Tickets</span>
                {allCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {allCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

              {/* Mobile View */}
              <div className="md:hidden">
                {loading ? (
                  renderLoading()
                ) : tickets.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <div className="space-y-4">
                    {tickets.map(renderMobileTicketCard)}
                  </div>
                )}
                {!loading && tickets.length > 0 && renderPagination()}
              </div>

              {/* Desktop View */}
              <Card className="hidden md:block p-6 shadow-sm border-muted">
                {loading ? (
                  renderLoading()
                ) : tickets.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold">
                              <button
                                onClick={() => handleSort("ticketNumber")}
                                className="flex items-center hover:text-primary transition-colors"
                              >
                                Ticket #
                                {getSortIcon("ticketNumber")}
                              </button>
                            </TableHead>
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Subject</TableHead>
                            <TableHead className="font-semibold">
                              <button
                                onClick={() => handleSort("status")}
                                className="flex items-center hover:text-primary transition-colors"
                              >
                                Status
                                {getSortIcon("status")}
                              </button>
                            </TableHead>
                            <TableHead className="font-semibold">Assigned To</TableHead>
                            <TableHead className="font-semibold">
                              <button
                                onClick={() => handleSort("createdAt")}
                                className="flex items-center hover:text-primary transition-colors"
                              >
                                Created
                                {getSortIcon("createdAt")}
                              </button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map(renderTicketRow)}
                        </TableBody>
                      </Table>
                    </div>
                    {renderPagination()}
                  </>
                )}
              </Card>
            </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}
