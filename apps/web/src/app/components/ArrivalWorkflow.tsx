'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, Loader2, MapPin, Navigation } from 'lucide-react';

type WorkflowStep = 'accepted' | 'arrived' | 'completed';

interface ArrivalWorkflowProps {
  requestId: string;
  providerId: string;
  serviceStartedAt?: string | null;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

export default function ArrivalWorkflow({
  requestId,
  currentStatus,
  onStatusChange,
}: ArrivalWorkflowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const step: WorkflowStep =
    currentStatus === 'completed' ? 'completed' :
    currentStatus === 'arrived' || currentStatus === 'in_progress' || currentStatus === 'work_in_progress' ? 'arrived' :
    'accepted';

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
    } finally {
      setIsUpdating(false);
    }
  }, [requestId]);

  const handleCompleteService = useCallback(async () => {
    try {
      await callApiRoute('completed');
      toast.success('Job completed. Customer can now pay and rate.');
      onStatusChange('completed');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [callApiRoute, onStatusChange]);

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <div className={`px-5 py-3 border-b ${
        step === 'accepted' ? 'bg-blue-50 border-blue-200' :
        step === 'arrived' ? 'bg-emerald-50 border-emerald-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'accepted' && <Navigation className="h-5 w-5 text-blue-600" />}
            {step === 'arrived' && <MapPin className="h-5 w-5 text-emerald-600" />}
            {step === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
            <span className="font-semibold text-sm">
              {step === 'accepted' && 'Accepted'}
              {step === 'arrived' && 'Arrived'}
              {step === 'completed' && 'Completed'}
            </span>
          </div>
          <Badge className={
            step === 'accepted' ? 'bg-blue-100 text-blue-800' :
            step === 'arrived' ? 'bg-emerald-100 text-emerald-800' :
            'bg-green-100 text-green-800'
          }>
            {step.toUpperCase()}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {step === 'accepted' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Go to the customer location. Ustaz will automatically mark you as arrived when your live GPS reaches the destination.
            </p>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              No manual heading or arrival buttons are needed. Keep location sharing enabled until you reach the customer.
            </div>
          </div>
        )}

        {step === 'arrived' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Arrival confirmed automatically. Complete the job when work is done so payment, rating, wallet and warranty logic can continue.
            </p>
            <Button
              onClick={handleCompleteService}
              disabled={isUpdating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Complete Job
            </Button>
          </div>
        )}

        {step === 'completed' && (
          <div className="text-center py-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-700">Job completed successfully</p>
            <p className="mt-1 text-sm text-gray-500">The customer can now pay and rate the service.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
