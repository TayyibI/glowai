"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface FaceDetectionErrorProps {
  onRetry: () => void;
}

export function FaceDetectionError({ onRetry }: FaceDetectionErrorProps) {
  return (
    <Card className="border border-blush/40">
      <p className="font-semibold text-brown">
        We couldn’t detect a face in this photo.
      </p>
      <p className="mt-1 text-sm text-brown/80">
        Please use a clear, front-facing selfie with good lighting and try again.
      </p>
      <Button variant="primary" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}
