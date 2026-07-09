'use client';

import { useState } from 'react';
import { supabase } from '../../../client/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Star, Loader2, CheckCircle, X } from 'lucide-react';

interface RatingModalProps {
  requestId: string;
  raterId: string;
  ratedUserId: string;   // for push notification
  ratedUserName: string;
  onComplete: () => void;
  onClose?: () => void;  // always shown as a cancel button
}

export default function RatingModal({
  requestId,
  raterId,
  ratedUserId,
  ratedUserName,
  onComplete,
  onClose,
}: RatingModalProps) {
  const [rating, setRating]             = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment]           = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('rate_user', {
        p_request_id: requestId,
        p_rater_id:   raterId,
        p_rating:     rating,
        p_comment:    comment || null,
      });

      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row?.success) throw new Error(row?.message || error?.message || 'Failed to submit rating');

      setSubmitted(true);
      toast.success('Rating submitted!');

      // Notify the provider about their new rating
      fetch('/api/chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: ratedUserId,
          preview: `⭐ You received a ${rating}/5 star rating${comment ? `: "${comment.slice(0, 60)}"` : ''}`,
        }),
      }).catch(() => {});

      setTimeout(() => { onComplete(); }, 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-700 mb-1">Thank you!</h3>
          <p className="text-sm text-gray-600">Your rating has been submitted successfully.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Rate {ratedUserName}</CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              aria-label="Skip rating"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            How was your experience with <strong>{ratedUserName}</strong>?
          </p>

          {/* Star selector */}
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1 h-4">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very good'}
            {rating === 5 && 'Excellent'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comment <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your feedback about the service…"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className={`w-full ${rating > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-300'} text-white`}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}
