import { useState } from 'react';
import { ActivityIndicator, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/ustaz-api';
import { Badge, Button, Card, LottieScene, PressableScale, Text, TextField, lottieSources } from './mobile-ui';
import { color, radius, space } from '../theme/tokens';

interface RatingModalProps {
  visible: boolean;
  requestId: string;
  raterId: string;
  ratedUserId: string;
  ratedUserName: string;
  onComplete: () => void;
  onClose: () => void;
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function RatingModal({
  visible,
  requestId,
  raterId,
  ratedUserId,
  ratedUserName,
  onComplete,
  onClose,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  async function handleSubmit() {
    if (rating === 0) { setError('Please select a rating'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('rate_user', {
        p_request_id: requestId,
        p_rater_id: raterId,
        p_rating: rating,
        p_comment: comment || null,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (rpcError || !row?.success) throw new Error(row?.message || rpcError?.message || 'Failed to submit rating');

      setSubmitted(true);

      sendPushNotification(
        [ratedUserId],
        'New rating',
        `You received a ${rating}/5 star rating${comment ? `: "${comment.slice(0, 60)}"` : ''}`,
      ).catch(() => {});

      setTimeout(() => { onComplete(); }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setRating(0); setComment(''); setSubmitted(false); setError(null); setIsFavorited(false);
    onClose();
  }

  async function toggleFavorite() {
    if (!raterId || !ratedUserId || savingFavorite) return;
    setSavingFavorite(true);
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('customer_id', raterId).eq('provider_id', ratedUserId);
        setIsFavorited(false);
      } else {
        await supabase.from('favorites').insert({ customer_id: raterId, provider_id: ratedUserId });
        setIsFavorited(true);
      }
    } catch {}
    setSavingFavorite(false);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: color.scrim, justifyContent: 'center', alignItems: 'center', padding: space.xl }}>
        <Card variant="elevated" style={{ width: '100%', maxWidth: 380, borderRadius: radius['2xl'] }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
            <Text variant="h2">{submitted ? 'Thank you!' : `Rate ${ratedUserName}`}</Text>
            <PressableScale onPress={handleClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={16} color={color.inkMuted} />
            </PressableScale>
          </View>

          {submitted ? (
            /* Success state */
            <View style={{ alignItems: 'center' }}>
              <LottieScene source={lottieSources.jobComplete} size={140} loop={false} />
              <Text variant="bodyLg" style={{ fontWeight: '700', color: color.success, marginBottom: space.xs }}>Rating submitted!</Text>
              <Text variant="label" tone="muted" center>Thank you for your feedback.</Text>

              {/* Favorite button */}
              <PressableScale onPress={toggleFavorite} disabled={savingFavorite}
                style={{ marginTop: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl, paddingVertical: space.md, borderRadius: radius.md,
                  backgroundColor: isFavorited ? color.errorBg : `${color.primary}14`, borderWidth: 1, borderColor: isFavorited ? '#FECACA' : `${color.primary}30` }}>
                {savingFavorite ? (
                  <ActivityIndicator color={color.primary} size="small" />
                ) : (
                  <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={20} color={isFavorited ? color.error : color.primary} />
                )}
                <Text variant="body" style={{ fontWeight: '700', color: isFavorited ? color.error : color.primary }}>
                  {isFavorited ? 'Saved to favorites' : `Save ${ratedUserName} as favorite`}
                </Text>
              </PressableScale>
            </View>
          ) : (
            /* Rating form */
            <View>
              <Text variant="label" tone="muted" center style={{ marginBottom: space.xl }}>
                How was your experience with{'\n'}<Text style={{ fontWeight: '700', color: color.ink }}>{ratedUserName}</Text>?
              </Text>

              {/* Star selector */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginBottom: space.sm }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <PressableScale key={star} onPress={() => setRating(star)} style={{ padding: space.xs }}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? '#F59E0B' : color.line}
                    />
                  </PressableScale>
                ))}
              </View>
              <Text variant="caption" tone="muted" center style={{ marginBottom: space.xl, height: 16 }}>
                {RATING_LABELS[rating]}
              </Text>

              {/* Comment */}
              <Text variant="label" tone="muted" style={{ marginBottom: space.sm, fontWeight: '700' }}>
                Comment <Text style={{ fontWeight: '400', color: color.line }}>(optional)</Text>
              </Text>
              <TextField value={comment} onChangeText={setComment} placeholder="Share your feedback about the service..." multiline numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: space.sm }} />

              {error ? <Text variant="label" style={{ color: color.error, marginTop: space.md, textAlign: 'center' }}>{error}</Text> : null}

              {/* Submit */}
              <Button
                label="Submit Rating"
                variant={rating > 0 && !isSubmitting ? 'primary' : 'soft'}
                icon={<Ionicons name="star" size={18} color={rating > 0 ? color.white : color.inkMuted} />}
                onPress={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                loading={isSubmitting}
                style={{ marginTop: space.xl }}
              />
            </View>
          )}
        </Card>
      </View>
    </Modal>
  );
}
