import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { supabase } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/ustaz-api';

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
    setRating(0); setComment(''); setSubmitted(false); setError(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 380, borderRadius: 24, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 20, color: '#1B1B27' }}>{submitted ? 'Thank you!' : `Rate ${ratedUserName}`}</Text>
            <Pressable onPress={handleClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={16} color="#6B7280" />
            </Pressable>
          </View>

          {submitted ? (
            /* Success state */
            <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 28 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              </View>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#10B981', marginBottom: 4 }}>Rating submitted!</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>Thank you for your feedback.</Text>
            </View>
          ) : (
            /* Rating form */
            <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
                How was your experience with{'\n'}<Text style={{ fontWeight: '700', color: '#1B1B27' }}>{ratedUserName}</Text>?
              </Text>

              {/* Star selector */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setRating(star)} style={{ padding: 4 }}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 20, height: 16 }}>
                {RATING_LABELS[rating]}
              </Text>

              {/* Comment */}
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
                Comment <Text style={{ fontWeight: '400', color: '#D1D5DB' }}>(optional)</Text>
              </Text>
              <TextInput value={comment} onChangeText={setComment} placeholder="Share your feedback about the service..." placeholderTextColor="#D1D5DB" multiline numberOfLines={3}
                style={{ minHeight: 80, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#1B1B27', textAlignVertical: 'top' }} />

              {error ? <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444', marginTop: 10, textAlign: 'center' }}>{error}</Text> : null}

              {/* Submit */}
              <Pressable onPress={handleSubmit} disabled={rating === 0 || isSubmitting}
                style={{ marginTop: 16, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: rating > 0 && !isSubmitting ? '#F59E0B' : '#E5E7EB' }}>
                {isSubmitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                  <>
                    <Ionicons name="star" size={18} color="#FFFFFF" />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Submit Rating</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}


