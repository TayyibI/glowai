"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface FaceDetectionErrorProps {
  onRetry: () => void;
}

export function FaceDetectionError({ onRetry }: FaceDetectionErrorProps) {
  return (
    <Card className="border border-dash-brand-red/20">
      <p className="font-semibold text-dash-text-negative">
        We couldn’t detect a face in this photo.
      </p>
      <p className="mt-1 text-sm text-dash-text-secondary">
        Please use a clear, front-facing selfie with good lighting and try again.
      </p>
      <Button variant="primary" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}
