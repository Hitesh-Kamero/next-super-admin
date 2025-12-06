"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEventFTPCredentials, type FTPCredentials } from "@/lib/events-api";
import { toast } from "sonner";
import { Loader2, Copy, Check, Server, Lock, Upload } from "lucide-react";

interface FTPCredentialsCardProps {
  eventDocId: string;
  eventName?: string;
}

export function FTPCredentialsCard({ eventDocId, eventName }: FTPCredentialsCardProps) {
  const [credentials, setCredentials] = useState<FTPCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDocId]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const creds = await getEventFTPCredentials(eventDocId);
      setCredentials(creds);
    } catch (error: any) {
      if (error.message?.includes("FTP is not enabled")) {
        // FTP not enabled - this is expected for some events
        setCredentials(null);
      } else {
        toast.error(error.message || "Failed to load FTP credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!credentials) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-4">
          FTP/SFTP upload is not enabled for this event
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Server className="h-5 w-5" />
          FTP/SFTP Upload Details
          {eventName && (
            <span className="text-sm font-normal text-muted-foreground">
              for: {eventName}
            </span>
          )}
        </h3>
        <Badge variant="default">Enabled</Badge>
      </div>

      <div className="space-y-6">
        {/* SFTP Section */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold">SFTP (Recommended - More Secure)</h4>
          </div>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Host:</span>
              <div className="flex items-center gap-2">
                <span>{credentials.sftpHost}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.sftpHost, "sftp-host")}
                >
                  {copiedField === "sftp-host" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Port:</span>
              <div className="flex items-center gap-2">
                <span>{credentials.sftpPort}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.sftpPort.toString(), "sftp-port")}
                >
                  {copiedField === "sftp-port" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Username:</span>
              <div className="flex items-center gap-2">
                <span>{credentials.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.username, "sftp-username")}
                >
                  {copiedField === "sftp-username" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Password:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{credentials.password}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.password, "sftp-password")}
                >
                  {copiedField === "sftp-password" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* FTP Section */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold">FTP</h4>
          </div>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Host:</span>
              <div className="flex items-center gap-2">
                <span>{credentials.ftpHost}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.ftpHost, "ftp-host")}
                >
                  {copiedField === "ftp-host" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Port:</span>
              <div className="flex items-center gap-2">
                <span>{credentials.ftpPort}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.ftpPort.toString(), "ftp-port")}
                >
                  {copiedField === "ftp-port" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Username:</span>
              <div className="flex items-center gap-2">
                <span>{credentials.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.username, "ftp-username")}
                >
                  {copiedField === "ftp-username" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Password:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{credentials.password}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(credentials.password, "ftp-password")}
                >
                  {copiedField === "ftp-password" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-4 w-4" />
            <h4 className="font-semibold text-sm">Instructions</h4>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {credentials.instructions}
          </p>
        </div>

        {/* Stats */}
        {credentials.ftpUploadCount > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Photos uploaded via FTP: </span>
              <span className="font-semibold">{credentials.ftpUploadCount}</span>
            </div>
            {credentials.ftpCreatedAt && (
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">FTP enabled: </span>
                <span>{new Date(credentials.ftpCreatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
