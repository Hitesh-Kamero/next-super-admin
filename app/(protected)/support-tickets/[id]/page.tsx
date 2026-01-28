"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getSupportTicket,
  updateTicketStatus,
  replyToTicket,
  closeTicket,
  getFileUrl,
  getAdminPresignedUrl,
  listAdminUsers,
  assignTicket,
  type SupportTicket,
  type SupportTicketAttachment,
  type AdminUserInfo,
} from "@/lib/support-tickets-api";
import { TicketActivityLog } from "@/components/ticket-activity-log";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, X, Loader2, Video, LogIn, Upload, FileImage, Paperclip, Ticket, Clock, CheckCircle2, AlertCircle, User, Send, Building2 } from "lucide-react";
import Image from "next/image";
import { formatDateIST, generateLoginAsUserUrl } from "@/lib/utils";
import parsePhoneNumber from "libphonenumber-js";

// Lightbox for image viewing
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

// Helper function to intelligently format phone number for WhatsApp using libphonenumber-js
const formatPhoneNumberForWhatsApp = (phone: string): string => {
  try {
    // Try parsing with default country as India (IN) for numbers without country code
    const phoneNumber = parsePhoneNumber(phone, { defaultCountry: "IN" });
    
    if (phoneNumber) {
      // Return the phone number in E.164 format (e.g., +91919967362908)
      return phoneNumber.number;
    }
    
    // If parsing fails, fallback to manual formatting
    // Remove all spaces, dashes, and other non-digit characters except +
    let cleanPhone = phone.replace(/[\s-()]/g, '');
    
    // If already starts with +, use as is
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    
    // If starts with 91 (Indian country code without +), add +
    if (cleanPhone.startsWith('91') && cleanPhone.length >= 12) {
      return `+${cleanPhone}`;
    }
    
    // If it's a 10-digit number (likely Indian mobile), add +91
    if (/^\d{10}$/.test(cleanPhone)) {
      return `+91${cleanPhone}`;
    }
    
    // Fallback: add +91 prefix
    return `+91${cleanPhone}`;
  } catch (error) {
    // If library fails, fallback to manual formatting
    let cleanPhone = phone.replace(/[\s-()]/g, '');
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    return `+91${cleanPhone}`;
  }
};

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = params.id as string;
  
  // Get return URL from query params (preserves list page state)
  const returnUrl = searchParams.get("returnUrl") || "/support-tickets";

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Lightbox state for images
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Video viewer state
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoName, setCurrentVideoName] = useState<string>("");
  
  // File attachment state for admin replies
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assignment state
  const [adminUsers, setAdminUsers] = useState<AdminUserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Collect all image items from ticket for lightbox
  const getAllImageItems = () => {
    if (!ticket) return [];
    const items: Array<{ src: string; alt: string; downloadFilename: string }> = [];
    
    // Add ticket attachments
    ticket.attachments.forEach((att) => {
      const isImage = att.fileType === "screenshot" || att.contentType?.startsWith("image/");
      if (isImage) {
        items.push({
          src: getFileUrl(att.storageKey),
          alt: att.fileName,
          downloadFilename: att.fileName,
        });
      }
    });
    
    // Add reply attachments
    ticket.replies.forEach((reply) => {
      reply.attachments.forEach((att) => {
        const isImage = att.fileType === "screenshot" || att.contentType?.startsWith("image/");
        if (isImage) {
          items.push({
            src: getFileUrl(att.storageKey),
            alt: att.fileName,
            downloadFilename: att.fileName,
          });
        }
      });
    });
    
    return items;
  };

  // Open lightbox at specific image URL
  const openImageViewer = (url: string) => {
    const allImages = getAllImageItems();
    const index = allImages.findIndex((item) => item.src === url);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Open video viewer
  const openVideoViewer = (url: string, fileName: string) => {
    setCurrentVideoUrl(url);
    setCurrentVideoName(fileName);
    setVideoViewerOpen(true);
  };

  // Navigate back to list with preserved state
  const navigateBack = () => {
    router.push(returnUrl);
  };

  useEffect(() => {
    if (ticketId) {
      loadTicket();
      loadAdminUsers();
    }
  }, [ticketId]);

  const loadAdminUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await listAdminUsers();
      setAdminUsers(users);
    } catch (error: any) {
      toast.error(error.message || "Failed to load admin users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssignTicket = async (assignedToUserID: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const updated = await assignTicket(ticket.id, assignedToUserID);
      setTicket(updated);
      toast.success("Ticket assigned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign ticket");
    } finally {
      setUpdating(false);
    }
  };

  const loadTicket = async () => {
    setLoading(true);
    try {
      const data = await getSupportTicket(ticketId);
      setTicket(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load ticket");
      navigateBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const updated = await updateTicketStatus(
        ticket.id,
        newStatus as "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "CLOSED"
      );
      setTicket(updated);
      toast.success("Status updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const updated = await closeTicket(ticket.id);
      setTicket(updated);
      toast.success("Ticket closed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to close ticket");
    } finally {
      setUpdating(false);
    }
  };

  // File attachment handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Validate file type (images and videos only)
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      if (!isImage && !isVideo) {
        toast.error(`Invalid file type: ${file.name}. Only images and videos are allowed.`);
        continue;
      }
      
      // Validate file size
      const maxSize = isImage ? 100 * 1024 * 1024 : 1024 * 1024 * 1024; // 100MB for images, 1GB for videos
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds the ${isImage ? '100MB' : '1GB'} limit`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setReplyAttachments(prev => [...prev, ...validFiles]);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllAttachments = () => {
    setReplyAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileType = (file: File): "screenshot" | "video" => {
    return file.type.startsWith("video/") ? "video" : "screenshot";
  };

  const uploadAttachments = async (ticketId: string): Promise<SupportTicketAttachment[]> => {
    const uploadedAttachments: SupportTicketAttachment[] = [];
    
    for (let i = 0; i < replyAttachments.length; i++) {
      const file = replyAttachments[i];
      setUploadProgress(`Uploading ${i + 1}/${replyAttachments.length}: ${file.name}`);
      
      try {
        // Get presigned URL
        const { presignedUrl, storageKey } = await getAdminPresignedUrl(
          ticketId,
          file.name,
          file.type,
          file.size,
          getFileType(file)
        );
        
        // Upload file to GCS
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        uploadedAttachments.push({
          storageKey,
          fileName: file.name,
          fileType: getFileType(file),
          contentType: file.type,
          fileSize: file.size,
        });
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        throw error;
      }
    }
    
    return uploadedAttachments;
  };

  const handleReply = async () => {
    if (!ticket || !replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setUpdating(true);
    try {
      // Upload attachments first if any
      let attachments: SupportTicketAttachment[] = [];
      if (replyAttachments.length > 0) {
        attachments = await uploadAttachments(ticket.id);
      }
      
      setUploadProgress("");
      const updated = await replyToTicket(ticket.id, replyMessage, attachments);
      setTicket(updated);
      setReplyMessage("");
      clearAllAttachments();
      setIsReplyOpen(false);
      toast.success("Reply sent successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reply");
    } finally {
      setUpdating(false);
      setUploadProgress("");
    }
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
        return <AlertCircle className="h-3.5 w-3.5" />;
      case "IN_PROGRESS":
        return <Clock className="h-3.5 w-3.5" />;
      case "WAITING_FOR_USER":
        return <MessageSquare className="h-3.5 w-3.5" />;
      case "CLOSED":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "OPEN": return "Open";
      case "IN_PROGRESS": return "In Progress";
      case "WAITING_FOR_USER": return "Waiting";
      case "CLOSED": return "Closed";
      default: return status;
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    );
  }

  if (!ticket) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Ticket not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={navigateBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-4">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateBack}
                className="h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">#{ticket.ticketNumber}</h1>
                  <p className="text-xs text-muted-foreground">{formatDateIST(ticket.createdAt)}</p>
                </div>
              </div>
            </div>
            <Badge className={`${getStatusBadgeStyle(ticket.status)} border flex items-center gap-1.5 px-3 py-1`}>
              {getStatusIcon(ticket.status)}
              {formatStatus(ticket.status)}
            </Badge>
          </div>

          {/* Main Content Grid - Left sidebar, Right chat */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left Column - User Details & Actions */}
            <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
              {/* User Details Card */}
              <Card className="p-4 border-l-4 border-l-primary">
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  User Details
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Email</span>
                    <p className="font-medium text-sm truncate">{ticket.userEmail}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{ticket.userMobile || "N/A"}</span>
                      {ticket.userMobile && (
                        <button
                          onClick={() => {
                            const phoneNumber = formatPhoneNumberForWhatsApp(ticket.userMobile);
                            const message = encodeURIComponent(`Hi! This is Kamero support regarding ticket #${ticket.ticketNumber}`);
                            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                          }}
                          className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-950/20"
                          title="WhatsApp"
                        >
                          <img src="/icons/whatsapp-icon.svg" alt="WhatsApp" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Whitelabel
                    </span>
                    <p className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded inline-block">{ticket.whitelabelId}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">User ID</span>
                    <button
                      onClick={() => router.push(`/users?userId=${encodeURIComponent(ticket.userId)}`)}
                      className="block font-mono text-xs text-primary hover:underline truncate"
                    >
                      {ticket.userId.slice(0, 12)}...
                    </button>
                  </div>
                  {ticket.eventDocID && (
                    <div>
                      <span className="text-xs text-muted-foreground">Event</span>
                      <button
                        onClick={() => router.push(`/events?eventId=${encodeURIComponent(ticket.eventDocID!)}`)}
                        className="block text-xs text-primary hover:underline truncate"
                      >
                        {ticket.eventName || ticket.eventDocID}
                      </button>
                    </div>
                  )}
                </div>
                {ticket.userEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 h-8 text-xs"
                    onClick={() => {
                      const loginUrl = generateLoginAsUserUrl(ticket.userEmail);
                      window.open(loginUrl, '_blank');
                      toast.success("Opening login page in new tab");
                    }}
                  >
                    <LogIn className="h-3 w-3 mr-1.5" />
                    Login as User
                  </Button>
                )}
              </Card>

              {/* Actions Card */}
              <Card className="p-4 border-l-4 border-l-amber-500">
                <h3 className="font-semibold mb-3 text-sm">Actions</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={ticket.status}
                      onValueChange={handleStatusChange}
                      disabled={updating}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Assign To</Label>
                    <Select
                      value={ticket.assignedTo || "unassigned"}
                      onValueChange={(value) => value !== "unassigned" && handleAssignTicket(value)}
                      disabled={updating || loadingUsers}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder={loadingUsers ? "Loading..." : "Select"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {adminUsers.map((user) => (
                          <SelectItem key={user.userId} value={user.userId}>
                            {user.displayName || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ticket.assignedToEmail && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {ticket.assignedToEmail}
                      </p>
                    )}
                  </div>
                  {ticket.status !== "CLOSED" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={handleCloseTicket}
                      disabled={updating}
                    >
                      <X className="h-3 w-3 mr-1.5" />
                      Close Ticket
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - Chat & Activity Log */}
            <div className="lg:col-span-3 space-y-4 order-1 lg:order-2">
              {/* Chat Card - Enhanced ChatGPT-like UI */}
              <Card className="flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    {ticket.subject || "Support Conversation"}
                  </h3>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-[350px] max-h-[550px] bg-gradient-to-b from-slate-50/30 to-white dark:from-slate-900/30 dark:to-slate-950">
                  {/* Initial Ticket Message */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="font-semibold text-sm text-violet-700 dark:text-violet-400">
                          {ticket.userEmail.split("@")[0]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{formatDateIST(ticket.createdAt)}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md border border-slate-200 dark:border-slate-700">
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">{ticket.description}</p>
                        {ticket.attachments.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {ticket.attachments.map((att, idx) => {
                              const fileUrl = getFileUrl(att.storageKey);
                              const isImage = att.fileType === "screenshot" || (att.contentType?.startsWith("image/"));
                              const isVideo = att.fileType === "video" || (att.contentType?.startsWith("video/"));
                              
                              return (
                                <div
                                  key={idx}
                                  className="relative group w-24 h-24 border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-105 transition-all"
                                  onClick={() => {
                                    if (isImage) openImageViewer(fileUrl);
                                    else if (isVideo) openVideoViewer(fileUrl, att.fileName);
                                    else window.open(fileUrl, '_blank');
                                  }}
                                >
                                  {isImage ? (
                                    <Image src={fileUrl} alt={att.fileName} fill className="object-cover" sizes="96px" />
                                  ) : isVideo ? (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                      <Video className="h-8 w-8 text-slate-500" />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                      <FileImage className="h-8 w-8 text-slate-500" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conversation Replies */}
                  {ticket.replies.map((reply) => {
                    // Get admin name from createdBy field (email) for admin replies
                    const displayName = reply.from === "admin" 
                      ? reply.createdBy?.split("@")[0] || "Support"
                      : ticket.userEmail.split("@")[0];
                    
                    return (
                      <div key={reply.id} className={`flex gap-4 ${reply.from === "admin" ? "flex-row-reverse" : ""}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                          reply.from === "admin" 
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600" 
                            : "bg-gradient-to-br from-violet-500 to-purple-600"
                        }`}>
                          {reply.from === "admin" ? (
                            <MessageSquare className="h-5 w-5 text-white" />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className={`flex-1 max-w-[85%] ${reply.from === "admin" ? "flex flex-col items-end" : ""}`}>
                          <div className={`flex items-baseline gap-2 mb-2 ${reply.from === "admin" ? "flex-row-reverse" : ""}`}>
                            <span className={`font-semibold text-sm ${
                              reply.from === "admin" 
                                ? "text-emerald-700 dark:text-emerald-400" 
                                : "text-violet-700 dark:text-violet-400"
                            }`}>
                              {displayName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{formatDateIST(reply.createdAt)}</span>
                          </div>
                          <div className={`rounded-2xl px-5 py-4 shadow-md ${
                            reply.from === "admin"
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm"
                          }`}>
                            <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${
                              reply.from === "admin" ? "text-white" : "text-slate-800 dark:text-slate-200"
                            }`}>{reply.message}</p>
                            {reply.attachments.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {reply.attachments.map((att, idx) => {
                                  const fileUrl = getFileUrl(att.storageKey);
                                  const isImage = att.fileType === "screenshot" || (att.contentType?.startsWith("image/"));
                                  const isVideo = att.fileType === "video" || (att.contentType?.startsWith("video/"));
                                  
                                  return (
                                    <div
                                      key={idx}
                                      className={`w-20 h-20 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 hover:scale-105 transition-all ${
                                        reply.from === "admin" ? "border-2 border-white/30" : "border-2 border-slate-200 dark:border-slate-600"
                                      }`}
                                      onClick={() => {
                                        if (isImage) openImageViewer(fileUrl);
                                        else if (isVideo) openVideoViewer(fileUrl, att.fileName);
                                        else window.open(fileUrl, '_blank');
                                      }}
                                    >
                                      {isImage ? (
                                        <Image src={fileUrl} alt={att.fileName} width={80} height={80} className="object-cover w-full h-full" />
                                      ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${
                                          reply.from === "admin" ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"
                                        }`}>
                                          <Video className="h-5 w-5" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {ticket.replies.length === 0 && (
                    <div className="text-center py-10">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4">
                        <MessageSquare className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">No replies yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Start the conversation by sending a reply</p>
                    </div>
                  )}
                </div>

                {/* Chat Input Area - ChatGPT Style */}
                <div className="p-4 border-t bg-muted/30">
                  {ticket.status === "CLOSED" ? (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      This ticket is closed. Reopen it to continue the conversation.
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => {
                          setIsReplyOpen(true);
                          // Delay file picker to allow dialog to render
                          setTimeout(() => fileInputRef.current?.click(), 100);
                        }}
                        title="Add attachment"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div 
                        className="flex-1 min-h-[40px] px-4 py-2 bg-background border rounded-xl cursor-text flex items-center text-muted-foreground hover:border-primary/50 transition-colors"
                        onClick={() => setIsReplyOpen(true)}
                      >
                        <span className="text-sm">Type your reply...</span>
                      </div>
                      <Button
                        className="h-10 px-4 bg-primary hover:bg-primary/90"
                        onClick={() => setIsReplyOpen(true)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Activity Log - Below Chat */}
              <Card className="p-4 border-l-4 border-l-slate-400">
                <TicketActivityLog ticketId={ticketId} compact />
              </Card>
            </div>
          </div>
        </main>

        {/* Hidden file input - placed outside dialog so it's always available */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Reply Dialog - Enhanced */}
        <Dialog open={isReplyOpen} onOpenChange={(open) => {
          setIsReplyOpen(open);
          if (!open) {
            setReplyMessage("");
            clearAllAttachments();
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Reply to Ticket #{ticket.ticketNumber}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Your reply will be sent to <span className="font-medium text-foreground">{ticket.userEmail}</span> via email
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Message Input - Large Text Area */}
              <div className="flex-1">
                <Label htmlFor="reply-message" className="text-sm font-medium flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Your Message
                </Label>
                <Textarea
                  id="reply-message"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here... Be helpful and clear in your response."
                  rows={14}
                  className="resize-none text-[15px] leading-relaxed p-4 rounded-xl border-2 focus:border-primary/50 transition-colors min-h-[280px]"
                  autoFocus
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Tip: Be clear and concise in your response</span>
                  <span>{replyMessage.length} characters</span>
                </div>
              </div>
              
              {/* File Attachments Section - Compact */}
              <div className="bg-muted/20 rounded-lg p-3 border border-dashed border-muted-foreground/20">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachments (Optional)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Add Files
                  </Button>
                </div>
                
                {replyAttachments.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        {replyAttachments.length} file(s) ready
                      </span>
                      <button
                        type="button"
                        onClick={clearAllAttachments}
                        className="text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {replyAttachments.map((file, index) => {
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        const previewUrl = URL.createObjectURL(file);
                        
                        return (
                          <div
                            key={index}
                            className="relative group w-16 h-16 border rounded-lg overflow-hidden bg-background hover:border-primary/50 transition-colors"
                          >
                            {isImage ? (
                              <img
                                src={previewUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onLoad={() => URL.revokeObjectURL(previewUrl)}
                              />
                            ) : isVideo ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <Video className="h-6 w-6 text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <FileImage className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Upload Progress */}
              {uploadProgress && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">{uploadProgress}</span>
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Email notification will be sent automatically
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReplyOpen(false);
                    setReplyMessage("");
                    clearAllAttachments();
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReply} 
                  disabled={updating || !replyMessage.trim()}
                  className="px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {replyAttachments.length > 0 
                    ? `Send with ${replyAttachments.length} file(s)`
                    : "Send Reply"
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Lightbox using yet-another-react-lightbox */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={getAllImageItems()}
          plugins={[Zoom, Thumbnails, Download, Fullscreen]}
          zoom={{
            maxZoomPixelRatio: 5,
            zoomInMultiplier: 2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            doubleClickMaxStops: 2,
            keyboardMoveDistance: 50,
            wheelZoomDistanceFactor: 100,
            pinchZoomDistanceFactor: 100,
            scrollToZoom: true,
          }}
          thumbnails={{
            position: "bottom",
            width: 80,
            height: 60,
            border: 2,
            borderRadius: 4,
            padding: 4,
            gap: 8,
          }}
          styles={{
            container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
          }}
          carousel={{
            finite: false,
            preload: 2,
          }}
          animation={{
            fade: 250,
            swipe: 500,
          }}
        />

        {/* Video Viewer Modal */}
        {videoViewerOpen && currentVideoUrl && (
          <Dialog open={videoViewerOpen} onOpenChange={setVideoViewerOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-0">
              <DialogTitle className="sr-only">Video Player - {currentVideoName}</DialogTitle>
              <div className="relative w-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-black/80">
                  <span className="text-white/80 text-sm truncate max-w-[80%]">{currentVideoName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
                    onClick={() => setVideoViewerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Video Player */}
                <div className="flex items-center justify-center bg-black p-4">
                  <video
                    src={currentVideoUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[80vh] rounded-lg"
                    style={{ maxWidth: "90vw" }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AuthGuard>
  );
}

