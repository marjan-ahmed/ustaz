'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ServiceTimer from './ServiceTimer';
import {
  MapPin,
  Navigation,
  Clock,
  Play,
  CheckCircle,
  ArrowRight,
  Loader2,
  Timer,
  AlertCircle,
  Hourglass,
  XCircle,
} from 'lucide-react';

type WorkflowStep = 'en_route' | 'arrived' | 'in_progress' | 'completed';

interface ArrivalWorkflowProps {
  requestId: string;
  providerId: string;
  serviceStartedAt?: string | null;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

const WAIT_DURATION_MS = 15 * 60 * 1000; // 15 minutes wait timer

export default function ArrivalWorkflow({
  requestId,
  providerId,
  serviceStartedAt,
  currentStatus,
  onStatusChange,
}: ArrivalWorkflowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitElapsed, setWaitElapsed] = useState(0);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine current step from status
  const step: WorkflowStep =
    currentStatus === 'arrived' ? 'arrived' :
    currentStatus === 'in_progress' || currentStatus === 'work_in_progress' ? 'in_progress' :
    currentStatus === 'completed' ? 'completed' :
    'en_route';

  // Wait timer tick
  useEffect(() => {
    if (step !== 'arrived') {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      return;
    }
    setWaitElapsed(0);
    waitTimerRef.current = setInterval(() => {
      setWaitElapsed((prev) => prev + 1000);
    }, 1000);

    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    };
  }, [step]);

  // Helper to call the API route for any status transition
  // Must be defined before any callback that references it (to avoid TDZ ReferenceError)
  const callApiRoute = useCallback(async (action: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/update-request-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      return data;
    } catch (err: any) {
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [requestId]);

  const handleArrive = useCallback(async () => {
    try {
      await callApiRoute('arriving');
      toast.success('Marked as arriving');
      onStatusChange('arriving');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [callApiRoute, onStatusChange]);

  const handleArrived = useCallback(async () => {
    try {
      await callApiRoute('arrived');
      toast.success('You have arrived!');
      onStatusChange('arrived');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [callApiRoute, onStatusChange]);

  const handleStartService = useCallback(async () => {
    try {
      await callApiRoute('start_service');
      toast.success('Service started!');
      onStatusChange('in_progress');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [callApiRoute, onStatusChange]);

  const handleCompleteService = useCallback(async () => {
    try {
      await callApiRoute('completed');
      toast.success('Service completed!');
      onStatusChange('completed');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [callApiRoute, onStatusChange]);

  const waitMinutes = Math.floor(waitElapsed / 60000);
  const waitSeconds = Math.floor((waitElapsed % 60000) / 1000);
  const waitFormatted = `${waitMinutes.toString().padStart(2, '0')}:${waitSeconds.toString().padStart(2, '0')}`;
  const canCancelAfterWait = waitElapsed >= WAIT_DURATION_MS;

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <div className={`px-5 py-3 border-b ${
        step === 'en_route' ? 'bg-blue-50 border-blue-200' :
        step === 'arrived' ? 'bg-amber-50 border-amber-200' :
        step === 'in_progress' ? 'bg-indigo-50 border-indigo-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'en_route' && <Navigation className="h-5 w-5 text-blue-600" />}
            {step === 'arrived' && <MapPin className="h-5 w-5 text-amber-600" />}
            {step === 'in_progress' && <Play className="h-5 w-5 text-indigo-600" />}
            {step === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
            <span className="font-semibold text-sm">
              {step === 'en_route' && 'En Route'}
              {step === 'arrived' && 'Arrived at Location'}
              {step === 'in_progress' && 'Service In Progress'}
              {step === 'completed' && 'Service Completed'}
            </span>
          </div>
          <Badge className={
            step === 'en_route' ? 'bg-blue-100 text-blue-800' :
            step === 'arrived' ? 'bg-amber-100 text-amber-800' :
            step === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
            'bg-green-100 text-green-800'
          }>
            {currentStatus.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Step 1: Mark as arriving / arrived */}
        {step === 'en_route' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Head to the customer's location. Mark your status when you arrive.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleArrive}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
                I'm on my way
              </Button>
              <Button
                onClick={handleArrived}
                disabled={isUpdating}
                variant="outline"
                className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                I've arrived
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Arrived — wait timer + start service */}
        {step === 'arrived' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Hourglass className={`h-5 w-5 ${canCancelAfterWait ? 'text-red-500' : 'text-amber-500'}`} />
                  <span className="text-2xl font-mono font-bold text-amber-700">{waitFormatted}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {canCancelAfterWait
                    ? 'Waiting period complete — you may cancel if customer doesn\'t respond'
                    : 'Wait time before cancellation (15 min)'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleStartService}
                disabled={isUpdating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Start Service
              </Button>
              {canCancelAfterWait && (
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  disabled={isUpdating}
                  onClick={async () => {
                    try {
                      await callApiRoute('cancelled');
                      toast.info('Request cancelled (no-show)');
                      onStatusChange('cancelled');
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel (no-show)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: In Progress — service timer + complete */}
        {step === 'in_progress' && (
          <div className="space-y-4">
            <ServiceTimer startedAt={serviceStartedAt} />

            <div className="flex gap-3">
              <Button
                onClick={handleCompleteService}
                disabled={isUpdating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Complete Service
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Completed */}
        {step === 'completed' && (
          <div className="text-center py-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-700">Service completed successfully</p>
            {serviceStartedAt && (
              <div className="mt-2 text-sm text-gray-500">
                <ServiceTimer startedAt={serviceStartedAt} compact />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
