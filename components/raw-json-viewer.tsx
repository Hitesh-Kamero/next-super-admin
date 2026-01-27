"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface RawJsonViewerProps {
  data: Record<string, any>;
  title?: string;
}

export function RawJsonViewer({ data, title = "Raw JSON Document" }: RawJsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Card className="p-4 mt-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="font-semibold">{title}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy JSON
            </>
          )}
        </Button>
      </div>
      {isExpanded && (
        <pre className="mt-4 p-4 bg-muted rounded-lg overflow-auto max-h-96 text-xs font-mono">
          {jsonString}
        </pre>
      )}
    </Card>
  );
}
