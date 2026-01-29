"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calculator, ChevronDown } from "lucide-react";
import type { UploadsLeftCalculation } from "@/lib/events-api";

interface UploadsLeftCalculationProps {
  calculation: UploadsLeftCalculation;
}

export function UploadsLeftCalculationCard({ calculation }: UploadsLeftCalculationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isPackEvent = calculation.eventType === "pack";

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full cursor-pointer">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Uploads Left Calculation</h3>
          <Badge variant="outline" className="ml-auto">
            {calculation.eventType}
          </Badge>
          <Badge variant="secondary">{calculation.counterSource}</Badge>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <div className="space-y-4 text-sm">
        {/* Input Values */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3 bg-muted/30 rounded-lg">
          <div className="flex justify-between">
            <span className="text-muted-foreground">maxPhotos</span>
            <span className="font-mono font-medium">{(calculation.maxPhotos ?? 0).toLocaleString()}</span>
          </div>
          {isPackEvent && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">guestMaxPhotos</span>
                <span className="font-mono font-medium">{(calculation.guestMaxPhotos ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">currentPhotosCount</span>
                <span className="font-mono font-medium text-green-600">{(calculation.currentPhotosCount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">uploadedPhotosCount</span>
                <span className="font-mono font-medium text-orange-600">{(calculation.uploadedPhotosCount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">currentOriginalFiles</span>
                <span className="font-mono font-medium">{(calculation.currentOriginalFilesCount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">discountedOriginals</span>
                <span className="font-mono font-medium text-gray-500">{(calculation.discountedOriginals ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between col-span-2 pt-1 border-t">
                <span className="text-muted-foreground">effectiveOriginalFiles</span>
                <span className="font-mono font-medium text-purple-600">{(calculation.effectiveOriginalFilesCount ?? 0).toLocaleString()}</span>
              </div>
            </>
          )}
          {!isPackEvent && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">uploadedPhotosCount</span>
                <span className="font-mono font-medium text-orange-600">{(calculation.uploadedPhotosCount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">originalFilesCount (2x)</span>
                <span className="font-mono font-medium text-purple-600">{(calculation.currentOriginalFilesCount ?? 0).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Calculation Steps */}
        {isPackEvent ? (
          <div className="space-y-3">
            {/* Normal Capacity */}
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Normal Capacity</div>
              <div className="font-mono text-xs text-muted-foreground">
                = (maxPhotos - guestMaxPhotos) - currentPhotos - effectiveOriginals
              </div>
              <div className="font-mono text-xs">
                = ({calculation.maxPhotos ?? 0} - {calculation.guestMaxPhotos ?? 0}) - {calculation.currentPhotosCount ?? 0} - {calculation.effectiveOriginalFilesCount ?? 0}
              </div>
              <div className="font-mono text-lg font-bold text-green-600">
                = {(calculation.normalCapacity ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Safety Capacity */}
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Safety Capacity (2.5× limit)</div>
              <div className="font-mono text-xs text-muted-foreground">
                safetyLimit = maxPhotos × 2.5 = {calculation.maxPhotos ?? 0} × 2.5 = {(calculation.safetyLimit ?? 0).toLocaleString()}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                = safetyLimit - uploadedPhotos - effectiveOriginals
              </div>
              <div className="font-mono text-xs">
                = {calculation.safetyLimit ?? 0} - {calculation.uploadedPhotosCount ?? 0} - {calculation.effectiveOriginalFilesCount ?? 0}
              </div>
              <div className="font-mono text-lg font-bold text-yellow-600">
                = {(calculation.safetyCapacity ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Final Result */}
            <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Final Result</div>
              <div className="font-mono text-xs">
                uploadsLeft = min(normalCapacity, safetyCapacity)
              </div>
              <div className="font-mono text-xs">
                = min({(calculation.normalCapacity ?? 0).toLocaleString()}, {(calculation.safetyCapacity ?? 0).toLocaleString()})
              </div>
              <div className="font-mono text-2xl font-bold text-primary">
                = {(calculation.uploadsLeft ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          /* Subscription Event */
          <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Subscription Calculation</div>
            <div className="font-mono text-xs text-muted-foreground">
              Original files count as 2 slots (1 standard + 1 original)
            </div>
            <div className="font-mono text-xs mt-2">
              uploadsLeft = maxPhotosLimit - (uploadedPhotos + originalFiles)
            </div>
            <div className="font-mono text-xs">
              = {(calculation.maxPhotos ?? 0).toLocaleString()} - ({(calculation.uploadedPhotosCount ?? 0).toLocaleString()} + {(calculation.currentOriginalFilesCount ?? 0).toLocaleString()})
            </div>
            <div className="font-mono text-2xl font-bold text-primary">
              = {(calculation.uploadsLeft ?? 0).toLocaleString()}
            </div>
          </div>
        )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
