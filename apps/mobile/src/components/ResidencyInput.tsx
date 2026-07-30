import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { KARACHI_AREAS } from '@ustaz/shared/utils';
import { Text, TextField } from '@/components/mobile-ui';
import { color, radius, space } from '@/theme/tokens';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface ResidencyInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export default function ResidencyInput({ value, onChange, error }: ResidencyInputProps) {
  const [detecting, setDetecting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [filter, setFilter] = useState('');
  const [hasDetected, setHasDetected] = useState(false);
  const focusedRef = useRef(false);

  const filtered = KARACHI_AREAS.filter((area) =>
    area.toLowerCase().includes(filter.toLowerCase())
  );

  /**
   * Extract the best neighborhood name from Google Geocoding address_components.
   * Priority: sublocality_level_1 (broader area) > sublocality > neighborhood
   * Falls back to matching against KARACHI_AREAS list.
   */
  function extractAreaFromGeocode(data: any): string | null {
    if (!data.results?.length) return null;
    const components: any[] = data.results[0].address_components || [];

    const find = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name;

    // Broader area first (sublocality_level_1 = "Malir", "Korangi", etc.)
    const sublocality1 = find('sublocality_level_1');
    if (sublocality1 && sublocality1.toLowerCase() !== 'karachi') return sublocality1;

    const sublocality = find('sublocality');
    if (sublocality && sublocality.toLowerCase() !== 'karachi') return sublocality;

    // Neighborhood level (specific housing society)
    const neighborhood = find('neighborhood');
    if (neighborhood) {
      // Try to match the neighborhood to a known Karachi area
      const match = KARACHI_AREAS.find(area =>
        neighborhood.toLowerCase().includes(area.toLowerCase()) ||
        area.toLowerCase().includes(neighborhood.toLowerCase())
      );
      if (match) return match;
      // If no match, return the neighborhood as-is
      return neighborhood;
    }

    // Fallback to locality (city), but only if it's not just "Karachi"
    const locality = find('locality');
    if (locality && locality.toLowerCase() !== 'karachi') return locality;

    // Last resort: parse the formatted address
    const formatted: string = data.results[0].formatted_address || '';
    const parts = formatted.split(',').map((s: string) => s.trim()).filter(Boolean);
    // Return the second-to-last part (usually the area before city/country)
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
    return null;
  }

  async function detectLocation() {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowPicker(true);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;

      if (!GOOGLE_MAPS_API_KEY) {
        // Fallback to expo-location reverse geocode
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const r = results[0];
          const parts = [r.name, r.street, r.district, r.city].filter(Boolean);
          const fullAddress = parts.join(', ');
          const areaParts = fullAddress.split(',').map(s => s.trim()).filter(Boolean);
          const area = areaParts.length >= 2 ? areaParts[areaParts.length - 2] : areaParts[0];
          if (area) onChange(area);
        }
        setShowPicker(true);
        return;
      }

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      const area = extractAreaFromGeocode(data);
      if (area) {
        onChange(area);
      } else {
        setShowPicker(true);
      }
    } catch (err) {
      console.error('Geolocation failed:', err);
      setShowPicker(true);
    } finally {
      setDetecting(false);
      setHasDetected(true);
    }
  }

  function handleFocus() {
    if (focusedRef.current) return;
    focusedRef.current = true;
    if (!hasDetected && !value) {
      detectLocation();
    } else {
      setShowPicker(true);
    }
  }

  return (
    <View>
      <Text variant="caption" tone="muted" style={{ marginBottom: space.xs, fontWeight: '600' }}>
        Where do you live? *
      </Text>
      <Pressable onPress={handleFocus}>
        <View pointerEvents="none">
          <TextField
            value={value}
            onChangeText={onChange}
            placeholder={detecting ? 'Detecting your location...' : 'e.g. Malir Halt, Defence, Clifton...'}
            error={error}
            editable={!detecting}
          />
        </View>
      </Pressable>

      {detecting && (
        <View style={s.detectingRow}>
          <ActivityIndicator size="small" color={color.primary} />
          <Text variant="caption" tone="muted" style={{ marginLeft: space.xs }}>
            Detecting your area...
          </Text>
        </View>
      )}

      {!detecting && !value && hasDetected && (
        <Pressable onPress={() => setShowPicker(true)} style={s.dropdownTrigger}>
          <Text variant="caption" tone="muted">
            Pick from a list of areas
          </Text>
          <Ionicons name="chevron-down" size={14} color={color.inkMuted} />
        </Pressable>
      )}

      {value && !detecting && (
        <Pressable
          onPress={() => {
            onChange('');
            setHasDetected(false);
            focusedRef.current = false;
          }}
          style={s.dropdownTrigger}
        >
          <Text variant="caption" tone="muted">
            Tap to change area
          </Text>
          <Ionicons name="refresh" size={14} color={color.inkMuted} />
        </Pressable>
      )}

      {error ? (
        <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>
          {error}
        </Text>
      ) : null}

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text variant="h3">Select your area</Text>
              <Pressable onPress={() => { setShowPicker(false); setFilter(''); }}>
                <Ionicons name="close" size={22} color={color.ink} />
              </Pressable>
            </View>

            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder="Search areas..."
              placeholderTextColor={color.inkMuted}
              style={s.searchInput}
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setShowPicker(false);
                    setFilter('');
                  }}
                  style={[s.areaItem, value === item && s.areaItemActive]}
                >
                  <Text
                    variant="body"
                    style={{ color: value === item ? color.primary : color.ink }}
                  >
                    {item}
                  </Text>
                  {value === item && (
                    <Ionicons name="checkmark-circle" size={18} color={color.primary} />
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={s.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  detectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xs,
    paddingHorizontal: space.xs,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
    paddingHorizontal: space.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: color.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    padding: space.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    fontSize: 15,
    color: color.ink,
    marginBottom: space.md,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  areaItemActive: {
    backgroundColor: `${color.primary}10`,
  },
  separator: {
    height: 1,
    backgroundColor: color.line,
    marginVertical: 2,
  },
});
