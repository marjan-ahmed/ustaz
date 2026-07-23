import { useState } from 'react';
import { View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, PressableScale, Text } from './mobile-ui';
import { color, radius, space } from '../theme/tokens';

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
      <View style={{ flex: 1, backgroundColor: color.scrim, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: color.white, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], paddingTop: space.xl, paddingBottom: space['2xl'], paddingHorizontal: space.xl, maxHeight: '80%' }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: color.line, alignSelf: 'center', marginBottom: space.lg }} />

          {/* Title */}
          <Text variant="h2" style={{ marginBottom: space.xs }}>Why are you cancelling?</Text>
          <Text variant="label" tone="muted" style={{ marginBottom: space.xl }}>
            This helps us improve our service. Optional.
          </Text>

          {/* Reason Options */}
          <View style={{ gap: space.sm, marginBottom: space.xl }}>
            {REASONS.map((reason) => {
              const isSelected = selected === reason.id;
              return (
                <PressableScale
                  key={reason.id}
                  onPress={() => setSelected(isSelected ? null : reason.id)}
                  disabled={loading}
                >
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: space.md,
                    paddingVertical: space.lg, paddingHorizontal: space.lg,
                    borderRadius: radius.md, borderWidth: 1.5,
                    borderColor: isSelected ? color.primary : color.line,
                    backgroundColor: isSelected ? `${color.primary}08` : color.surfaceAlt,
                  }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: radius.sm,
                      backgroundColor: isSelected ? `${color.primary}14` : color.surface,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name={reason.icon} size={18} color={isSelected ? color.primary : color.inkMuted} />
                    </View>
                    <Text variant="body" style={{ flex: 1, fontWeight: '600', color: isSelected ? color.ink : color.inkSoft }}>
                      {reason.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={color.primary} />
                    )}
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {/* Buttons */}
          <View style={{ gap: space.sm }}>
            <Button
              label="Cancel Request"
              variant={selected ? 'primary' : 'soft'}
              icon={<Ionicons name="close-circle" size={18} color={selected ? color.white : color.inkMuted} />}
              onPress={handleConfirm}
              disabled={!selected || loading}
              loading={loading}
            />
            <PressableScale onPress={onSkip} disabled={loading} style={{ paddingVertical: space.md, alignItems: 'center' }}>
              <Text variant="label" tone="muted" style={{ fontWeight: '600' }}>Skip — just cancel</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}
