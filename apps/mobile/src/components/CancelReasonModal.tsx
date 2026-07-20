import { useState } from 'react';
import { Pressable, Text, View, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const REASONS = [
  { id: 'found-better', label: 'Found a better option', icon: 'search' as const },
  { id: 'changed-mind', label: 'Changed my mind', icon: 'refresh' as const },
  { id: 'wrong-address', label: 'Wrong address / location', icon: 'location' as const },
  { id: 'too-expensive', label: 'Too expensive', icon: 'cash' as const },
  { id: 'no-response', label: 'Provider too slow', icon: 'time' as const },
  { id: 'duplicate', label: 'Duplicate request', icon: 'copy' as const },
];

interface CancelReasonModalProps {
  visible: boolean;
  onCancel: (reason: string) => void;
  onSkip: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function CancelReasonModal({
  visible,
  onCancel,
  onSkip,
  onClose,
  loading = false,
}: CancelReasonModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleConfirm() {
    if (selected) {
      onCancel(selected);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 34,
            paddingHorizontal: 20,
            maxHeight: '80%',
          }}
        >
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 }} />

          {/* Title */}
          <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#0f1729', marginBottom: 4 }}>
            Why are you cancelling?
          </Text>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>
            This helps us improve our service. Optional.
          </Text>

          {/* Reason Options */}
          <View style={{ gap: 8, marginBottom: 16 }}>
            {REASONS.map((reason) => {
              const isSelected = selected === reason.id;
              return (
                <Pressable
                  key={reason.id}
                  onPress={() => setSelected(isSelected ? null : reason.id)}
                  disabled={loading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#DB4B0D' : '#F3F4F6',
                    backgroundColor: isSelected ? '#FFF7ED' : '#F9FAFB',
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: isSelected ? '#DB4B0D15' : '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={reason.icon}
                      size={16}
                      color={isSelected ? '#DB4B0D' : '#9CA3AF'}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: 'AtkinsonHyperlegible',
                      fontSize: 14,
                      fontWeight: '600',
                      color: isSelected ? '#0f1729' : '#374151',
                    }}
                  >
                    {reason.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#DB4B0D" />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Buttons */}
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={handleConfirm}
              disabled={!selected || loading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: selected ? '#DB4B0D' : '#E5E7EB',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color={selected ? '#FFF' : '#9CA3AF'} />
                  <Text
                    style={{
                      fontFamily: 'AtkinsonHyperlegible',
                      fontSize: 14,
                      fontWeight: '700',
                      color: selected ? '#FFF' : '#9CA3AF',
                    }}
                  >
                    Cancel Request
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={onSkip}
              disabled={loading}
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: 'AtkinsonHyperlegible',
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#6B7280',
                }}
              >
                Skip — just cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
