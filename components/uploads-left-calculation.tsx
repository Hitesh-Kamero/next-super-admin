"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import type { UploadsLeftCalculation } from "@/lib/events-api";

interface UploadsLeftCalculationProps {
  calculation: UploadsLeftCalculation;
}

export function UploadsLeftCalculationCard({ calculation }: UploadsLeftCalculationProps) {
  const isPackEvent = calculation.eventType === "pack";

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Uploads Left Calculation</h3>
        <Badge variant="outline" className="ml-auto">
          {calculation.eventType}
        </Badge>
        <Badge variant="secondary">{calculation.counterSource}</Badge>
      </div>

      <div className="space-y-4 text-sm">
        {/* Input Values */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3 bg-muted/30 rounded-lg">
          <div className="flex justify-between">
            <span className="text-muted-foreground">maxPhotos</span>
            <span className="font-mono font-medium">{calculation.maxPhotos.toLocaleString()}</span>
          </div>
          {isPackEvent && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">guestMaxPhotos</span>
                <span className="font-mono font-medium">{calculation.guestMaxPhotos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">currentPhotosCount</span>
                <span className="font-mono font-medium text-green-600">{calculation.currentPhotosCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">uploadedPhotosCount</span>
                <span className="font-mono font-medium text-orange-600">{calculation.uploadedPhotosCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">currentOriginalFiles</span>
                <span className="font-mono font-medium">{calculation.currentOriginalFilesCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">discountedOriginals</span>
                <span className="font-mono font-medium text-gray-500">{calculation.discountedOriginals.toLocaleString()}</span>
              </div>
              <div className="flex justify-between col-span-2 pt-1 border-t">
                <span className="text-muted-foreground">effectiveOriginalFiles</span>
                <span className="font-mono font-medium text-purple-600">{calculation.effectiveOriginalFilesCount.toLocaleString()}</span>
              </div>
            </>
          )}
          {!isPackEvent && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">uploadedPhotosCount</span>
              <span className="font-mono font-medium text-orange-600">{calculation.uploadedPhotosCount.toLocaleString()}</span>
            </div>
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
                = ({calculation.maxPhotos} - {calculation.guestMaxPhotos}) - {calculation.currentPhotosCount} - {calculation.effectiveOriginalFilesCount}
              </div>
              <div className="font-mono text-lg font-bold text-green-600">
                = {calculation.normalCapacity.toLocaleString()}
              </div>
            </div>

            {/* Safety Capacity */}
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Safety Capacity (2.5× limit)</div>
              <div className="font-mono text-xs text-muted-foreground">
                safetyLimit = maxPhotos × 2.5 = {calculation.maxPhotos} × 2.5 = {calculation.safetyLimit.toLocaleString()}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                = safetyLimit - uploadedPhotos - effectiveOriginals
              </div>
              <div className="font-mono text-xs">
                = {calculation.safetyLimit} - {calculation.uploadedPhotosCount} - {calculation.effectiveOriginalFilesCount}
              </div>
              <div className="font-mono text-lg font-bold text-yellow-600">
                = {calculation.safetyCapacity.toLocaleString()}
              </div>
            </div>

            {/* Final Result */}
            <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Final Result</div>
              <div className="font-mono text-xs">
                uploadsLeft = min(normalCapacity, safetyCapacity)
              </div>
              <div className="font-mono text-xs">
                = min({calculation.normalCapacity.toLocaleString()}, {calculation.safetyCapacity.toLocaleString()})
              </div>
              <div className="font-mono text-2xl font-bold text-primary">
                = {calculation.uploadsLeft.toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          /* Subscription Event */
          <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Subscription Calculation</div>
            <div className="font-mono text-xs">
              uploadsLeft = uploadLimit - uploadedPhotosCount
            </div>
            <div className="font-mono text-xs">
              = {calculation.maxPhotos.toLocaleString()} - {calculation.uploadedPhotosCount.toLocaleString()}
            </div>
            <div className="font-mono text-2xl font-bold text-primary">
              = {calculation.uploadsLeft.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
