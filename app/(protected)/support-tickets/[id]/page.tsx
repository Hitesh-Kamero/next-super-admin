"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  type SupportTicket,
  type SupportTicketAttachment,
} from "@/lib/support-tickets-api";
import { TicketActivityLog } from "@/components/ticket-activity-log";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, X, Loader2, Video, Maximize2, LogIn, Upload, FileImage, Paperclip } from "lucide-react";
import Image from "next/image";
import { formatDateIST, generateLoginAsUserUrl } from "@/lib/utils";
import parsePhoneNumber from "libphonenumber-js";

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
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
  
  // File attachment state for admin replies
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const data = await getSupportTicket(ticketId);
      setTicket(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load ticket");
      router.push("/support-tickets");
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
              onClick={() => router.push("/support-tickets")}
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
        <main className="container mx-auto flex-1 px-4 py-4 md:py-8">
          <div className="mb-4 md:mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/support-tickets")}
              className="mb-3 md:mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">Ticket #{ticket.ticketNumber}</h1>
              </div>
            </div>
          </div>

          {/* User Details Section */}
          <div className="mb-4 md:mb-6">
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">User Details</h2>
                {ticket.userEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        const loginUrl = generateLoginAsUserUrl(ticket.userEmail);
                        window.open(loginUrl, '_blank', 'noopener,noreferrer');
                        toast.success(
                          <div className="space-y-2">
                            <div>Opening login page in new tab</div>
                            <div className="text-xs font-mono break-all bg-muted p-2 rounded mt-2">
                              {loginUrl}
                            </div>
                          </div>,
                          { duration: 10000 }
                        );
                      } catch (error: any) {
                        toast.error(error.message || "Failed to generate login URL");
                      }
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login as User
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                  <div className="mt-1">
                    <button
                      onClick={() => router.push(`/users?userId=${encodeURIComponent(ticket.userId)}`)}
                      className="text-base font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                    >
                      {ticket.userId}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="mt-1 text-base">{ticket.userEmail}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Contact Number</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-base">{ticket.userMobile || "Not provided"}</span>
                    {ticket.userMobile && (
                      <button
                        onClick={() => {
                          // Intelligently format phone number (detects existing country code)
                          const phoneNumber = formatPhoneNumberForWhatsApp(ticket.userMobile);
                          const message = encodeURIComponent(
                            `I am from kamero support team and we have received your support ticket ${ticket.ticketNumber}`
                          );
                          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                        title="Send WhatsApp message"
                        aria-label="Send WhatsApp message"
                      >
                        <img
                          src="/icons/whatsapp-icon.svg"
                          alt="WhatsApp"
                          className="w-5 h-5"
                        />
                      </button>
                    )}
                  </div>
                </div>
                {ticket.eventDocID && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Event DocID</Label>
                    <div className="mt-1">
                      <button
                        onClick={() => router.push(`/events?eventId=${encodeURIComponent(ticket.eventDocID!)}`)}
                        className="text-base font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                      >
                        {ticket.eventDocID}
                      </button>
                    </div>
                  </div>
                )}
                {ticket.eventName && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Event Name</Label>
                    <div className="mt-1 text-base">{ticket.eventName}</div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Activity Log - Internal Only */}
          <div className="mb-4 md:mb-6">
            <TicketActivityLog ticketId={ticketId} />
          </div>

          {/* Mobile: No outer card wrapper */}
          <div className="md:hidden space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={ticket.status}
                      onValueChange={handleStatusChange}
                      disabled={updating}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={`${getStatusBadgeStyle(ticket.status)} border shrink-0`}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {ticket.status !== "CLOSED" && (
                    <Button
                      variant="destructive"
                      onClick={handleCloseTicket}
                      disabled={updating}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close Ticket
                    </Button>
                  )}
                </div>
              </div>

              {ticket.subject && (
                <div>
                  <Label>Subject</Label>
                  <div className="mt-2 text-base">{ticket.subject}</div>
                </div>
              )}

              <div>
                <Label>Description</Label>
                <div className="mt-2 whitespace-pre-wrap text-base leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {ticket.eventName && (
                <div>
                  <Label>Related Event</Label>
                  <div className="mt-2 text-base">{ticket.eventName}</div>
                </div>
              )}

              {ticket.attachments.length > 0 && (
                <div>
                  <Label>Attachments</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {ticket.attachments.map((att, idx) => {
                      const fileUrl = getFileUrl(att.storageKey);
                      const isImage = att.fileType === "screenshot" || (att.contentType?.startsWith("image/"));
                      const isVideo = att.fileType === "video" || (att.contentType?.startsWith("video/"));
                      
                      return (
                        <div
                          key={idx}
                          className="relative group border rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-colors"
                        >
                          {isImage ? (
                            <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenImage(fileUrl)}>
                              <Image
                                src={fileUrl}
                                alt={att.fileName}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : isVideo ? (
                            <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenVideo(fileUrl)}>
                              <video
                                src={fileUrl}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <Video className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square flex items-center justify-center p-4">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline text-center"
                              >
                                {att.fileName}
                              </a>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                            {att.fileName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Conversation</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplyOpen(true)}
                    disabled={ticket.status === "CLOSED"}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
                <div className="space-y-4 rounded-lg border p-4 md:p-6">
                  {ticket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`rounded-lg p-4 md:p-5 border-2 ${
                        reply.from === "admin"
                          ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 md:ml-8"
                          : "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 md:mr-8"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={
                              reply.from === "admin"
                                ? "bg-blue-600 text-white border-blue-700"
                                : "bg-purple-600 text-white border-purple-700"
                            }
                          >
                            {reply.from === "admin" ? "Support Team" : "User"}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateIST(reply.createdAt)}
                        </span>
                      </div>
                      <div className={`text-base leading-relaxed whitespace-pre-wrap ${
                        reply.from === "admin" 
                          ? "text-blue-900 dark:text-blue-100" 
                          : "text-purple-900 dark:text-purple-100"
                      }`}>
                        {reply.message}
                      </div>
                      {reply.attachments.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {reply.attachments.map((att, idx) => {
                            const fileUrl = getFileUrl(att.storageKey);
                            const isImage = att.fileType === "screenshot" || (att.contentType?.startsWith("image/"));
                            const isVideo = att.fileType === "video" || (att.contentType?.startsWith("video/"));
                            
                            return (
                              <div
                                key={idx}
                                className="relative group border rounded overflow-hidden bg-muted/50 hover:bg-muted transition-colors"
                              >
                                {isImage ? (
                                  <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenImage(fileUrl)}>
                                    <Image
                                      src={fileUrl}
                                      alt={att.fileName}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ) : isVideo ? (
                                  <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenVideo(fileUrl)}>
                                    <video
                                      src={fileUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <div className="flex items-center gap-1">
                                        <Video className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="aspect-square flex items-center justify-center p-2">
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline text-center"
                                    >
                                      {att.fileName}
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Card wrapper */}
          <Card className="hidden md:block p-6">
            <div className="space-y-6">
              <div>
                <Label>Status</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={`${getStatusBadgeStyle(ticket.status)} border`}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  {ticket.status !== "CLOSED" && (
                    <Button
                      variant="destructive"
                      onClick={handleCloseTicket}
                      disabled={updating}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close Ticket
                    </Button>
                  )}
                </div>
              </div>

              {ticket.subject && (
                <div>
                  <Label>Subject</Label>
                  <div className="mt-2 text-base">{ticket.subject}</div>
                </div>
              )}

              <div>
                <Label>Description</Label>
                <div className="mt-2 whitespace-pre-wrap text-base leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {ticket.eventName && (
                <div>
                  <Label>Related Event</Label>
                  <div className="mt-2 text-base">{ticket.eventName}</div>
                </div>
              )}

              {ticket.attachments.length > 0 && (
                <div>
                  <Label>Attachments</Label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {ticket.attachments.map((att, idx) => {
                      const fileUrl = getFileUrl(att.storageKey);
                      const isImage = att.fileType === "screenshot" || (att.contentType?.startsWith("image/"));
                      const isVideo = att.fileType === "video" || (att.contentType?.startsWith("video/"));
                      
                      return (
                        <div
                          key={idx}
                          className="relative group border rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-colors"
                        >
                          {isImage ? (
                            <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenImage(fileUrl)}>
                              <Image
                                src={fileUrl}
                                alt={att.fileName}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : isVideo ? (
                            <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenVideo(fileUrl)}>
                              <video
                                src={fileUrl}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <Video className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square flex items-center justify-center p-4">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline text-center"
                              >
                                {att.fileName}
                              </a>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                            {att.fileName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Conversation</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplyOpen(true)}
                    disabled={ticket.status === "CLOSED"}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
                <div className="space-y-4 rounded-lg border p-4 md:p-6">
                  {ticket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`rounded-lg p-4 md:p-5 ${
                        reply.from === "admin"
                          ? "bg-primary/10 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-base font-semibold">
                          {reply.from === "admin" ? "Support Team" : "User"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDateIST(reply.createdAt)}
                        </span>
                      </div>
                      <div className="text-base leading-relaxed whitespace-pre-wrap">
                        {reply.message}
                      </div>
                      {reply.attachments.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {reply.attachments.map((att, idx) => {
                            const fileUrl = getFileUrl(att.storageKey);
                            const isImage = att.fileType === "screenshot" || (att.contentType?.startsWith("image/"));
                            const isVideo = att.fileType === "video" || (att.contentType?.startsWith("video/"));
                            
                            return (
                              <div
                                key={idx}
                                className="relative group border rounded overflow-hidden bg-muted/50 hover:bg-muted transition-colors"
                              >
                                {isImage ? (
                                  <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenImage(fileUrl)}>
                                    <Image
                                      src={fileUrl}
                                      alt={att.fileName}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ) : isVideo ? (
                                  <div className="relative aspect-square cursor-pointer" onClick={() => setFullScreenVideo(fileUrl)}>
                                    <video
                                      src={fileUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <div className="flex items-center gap-1">
                                        <Video className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="aspect-square flex items-center justify-center p-2">
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline text-center"
                                    >
                                      {att.fileName}
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </main>

        {/* Reply Dialog */}
        <Dialog open={isReplyOpen} onOpenChange={(open) => {
          setIsReplyOpen(open);
          if (!open) {
            setReplyMessage("");
            clearAllAttachments();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to Ticket</DialogTitle>
              <DialogDescription>
                Your reply will be sent to the user and trigger an email notification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reply-message">Message</Label>
                <Textarea
                  id="reply-message"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Enter your reply..."
                  rows={6}
                  className="mt-2"
                />
              </div>
              
              {/* File Attachments Section */}
              <div>
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments (Optional)
                </Label>
                <div className="text-xs text-muted-foreground mt-1 mb-2">
                  Attach screenshots (up to 100MB) or videos (up to 1GB) to your reply.
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-3"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
                
                {/* Attachment Preview Grid */}
                {replyAttachments.length > 0 && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{replyAttachments.length} file(s) selected</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllAttachments}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {replyAttachments.map((file, index) => {
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        const previewUrl = URL.createObjectURL(file);
                        
                        return (
                          <div
                            key={index}
                            className="relative group border rounded-lg overflow-hidden bg-background"
                          >
                            {isImage ? (
                              <div className="aspect-square relative">
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                                />
                              </div>
                            ) : isVideo ? (
                              <div className="aspect-square relative flex items-center justify-center bg-black/10">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="aspect-square relative flex items-center justify-center">
                                <FileImage className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white p-1.5">
                              <div className="text-xs truncate">{file.name}</div>
                              <div className="text-[10px] text-gray-300">
                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadProgress}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReplyOpen(false);
                    setReplyMessage("");
                    clearAllAttachments();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleReply} disabled={updating || !replyMessage.trim()}>
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  {replyAttachments.length > 0 
                    ? `Send Reply with ${replyAttachments.length} file(s)`
                    : "Send Reply"
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Full Screen Image Viewer */}
        {fullScreenImage && (
          <Dialog open={!!fullScreenImage} onOpenChange={() => setFullScreenImage(null)}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
              <DialogTitle className="sr-only">Full Screen Image Preview</DialogTitle>
              <div className="relative w-full h-[95vh] flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                  onClick={() => setFullScreenImage(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
                <Image
                  src={fullScreenImage}
                  alt="Full screen preview"
                  fill
                  className="object-contain"
                  sizes="95vw"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Full Screen Video Viewer */}
        {fullScreenVideo && (
          <Dialog open={!!fullScreenVideo} onOpenChange={() => setFullScreenVideo(null)}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
              <DialogTitle className="sr-only">Full Screen Video Preview</DialogTitle>
              <div className="relative w-full h-[95vh] flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                  onClick={() => setFullScreenVideo(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
                <video
                  src={fullScreenVideo}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AuthGuard>
  );
}

