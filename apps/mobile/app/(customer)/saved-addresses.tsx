import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Button, Card, Drift, EmptyState, FadeInUp, IsoServiceScene, PressableScale, Screen, Stagger, Text, TextField,
} from '@/components/mobile-ui';
import { color, radius, shadow, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  landmark: string | null;
  is_default: boolean;
  total_services: number;
  last_service_date: string | null;
  recurring_issues: string[];
}

export default function SavedAddressesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [newCoords, setNewCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_address_history', {
        p_customer_id: user.id,
      });
      if (!error && data) setAddresses(data);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  async function getCurrentLocationForNew() {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to save your current location.');
        setGettingLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setNewCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      const results = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (results[0]) {
        const r = results[0];
        setNewAddress([r.name, r.street, r.district, r.city, r.region].filter(Boolean).join(', '));
      }
    } catch {}
    setGettingLocation(false);
  }

  async function saveAddress() {
    if (!user || !newLabel.trim() || !newAddress.trim() || !newCoords) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('saved_addresses').insert({
        customer_id: user.id,
        label: newLabel.trim(),
        address: newAddress.trim(),
        latitude: newCoords.lat,
        longitude: newCoords.lng,
        landmark: newLandmark.trim() || null,
      });
      if (error) throw error;
      setShowAdd(false);
      setNewLabel('');
      setNewAddress('');
      setNewLandmark('');
      setNewCoords(null);
      loadAddresses();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save address');
    }
    setSaving(false);
  }

  async function deleteAddress(id: string) {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('saved_addresses').delete().eq('id', id);
          setAddresses(prev => prev.filter(a => a.id !== id));
        },
      },
    ]);
  }

  function bookAtAddress(addr: SavedAddress) {
    router.push({
      pathname: '/(customer)/book',
      params: {
        savedAddressId: addr.id,
        savedAddressLabel: addr.label,
        savedLat: String(addr.latitude),
        savedLng: String(addr.longitude),
      },
    });
  }

  return (
    <Screen bg={color.white} edges={['top']}>
      <FadeInUp>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, paddingBottom: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PressableScale onPress={() => router.back()} style={{ padding: space.xs }}>
              <Ionicons name="arrow-back" size={24} color={color.navy} />
            </PressableScale>
            <Text variant="h1" style={{ marginLeft: space.md }}>Addresses</Text>
          </View>
          <PressableScale onPress={() => setShowAdd(true)}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color.primary}14`, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={22} color={color.primary} />
          </PressableScale>
        </View>
      </FadeInUp>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" tone="muted">Loading addresses...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <EmptyState
          illustration={<Drift distance={6}><IsoServiceScene size={140} variant="general" /></Drift>}
          title="No saved addresses"
          subtitle="Save your frequently used addresses for faster booking"
        />
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space.lg }}>
          <Stagger step={40}>
            {addresses.map((addr) => (
              <PressableScale key={addr.id} onPress={() => bookAtAddress(addr)}>
                <Card variant="elevated" padded={false} style={{ marginBottom: space.sm, padding: space.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: addr.is_default ? `${color.primary}14` : color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={addr.is_default ? 'home' : 'location'} size={16} color={addr.is_default ? color.primary : color.inkMuted} />
                        </View>
                        <Text variant="bodyLg" style={{ fontWeight: '700' }}>{addr.label}</Text>
                        {addr.is_default && (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: color.primary }}>
                            <Text variant="caption" style={{ color: color.white, fontWeight: '700' }}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: space.xs, marginLeft: 40 }}>{addr.address}</Text>
                      {addr.landmark && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 40 }}>
                          <Ionicons name="flag" size={10} color="#D97706" />
                          <Text variant="caption" style={{ color: '#D97706' }}>{addr.landmark}</Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, marginLeft: 40 }}>
                        <Text variant="caption" tone="muted">
                          {addr.total_services} service{addr.total_services !== 1 ? 's' : ''}
                        </Text>
                        {addr.last_service_date && (
                          <Text variant="caption" tone="muted">
                            Last: {new Date(addr.last_service_date).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      {addr.recurring_issues && addr.recurring_issues.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, marginLeft: 40 }}>
                          {addr.recurring_issues.map((issue, i) => (
                            <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: color.errorBg }}>
                              <Text variant="caption" style={{ color: color.error, fontWeight: '700' }}>
                                Recurring: {issue}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <PressableScale onPress={() => deleteAddress(addr.id)} style={{ padding: space.xs }}>
                      <Ionicons name="trash-outline" size={16} color={color.line} />
                    </PressableScale>
                  </View>
                </Card>
              </PressableScale>
            ))}
          </Stagger>
        </View>
      )}

      {/* Add Address Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: color.scrim, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: color.white, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: space.xl, maxHeight: '80%' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: color.line, alignSelf: 'center', marginBottom: space.lg }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
              <Text variant="h2">Add Address</Text>
              <PressableScale onPress={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={16} color={color.inkMuted} />
              </PressableScale>
            </View>

            <View style={{ gap: space.md }}>
              <TextField label="Label" value={newLabel} onChangeText={setNewLabel} placeholder="e.g. Home, Office, Mom's house" />
              <TextField label="Address" value={newAddress} onChangeText={setNewAddress} placeholder="Full address" />
              <TextField label="Landmark (optional)" value={newLandmark} onChangeText={setNewLandmark} placeholder="Nearby landmark" />

              <PressableScale onPress={getCurrentLocationForNew} disabled={gettingLocation}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.md, borderRadius: radius.md, backgroundColor: color.surfaceAlt, borderWidth: 1, borderColor: color.line }}>
                {gettingLocation ? (
                  <ActivityIndicator color={color.primary} size="small" />
                ) : (
                  <Ionicons name="locate" size={16} color={color.primary} />
                )}
                <Text variant="body" style={{ fontWeight: '700', color: gettingLocation ? color.inkMuted : color.primary }}>
                  {gettingLocation ? 'Getting location...' : 'Use current location'}
                </Text>
              </PressableScale>

              {newCoords && (
                <Text variant="caption" style={{ color: color.success, textAlign: 'center' }}>
                  Location captured: {newCoords.lat.toFixed(4)}, {newCoords.lng.toFixed(4)}
                </Text>
              )}

              <Button
                label="Save Address"
                onPress={saveAddress}
                disabled={!newLabel.trim() || !newAddress.trim() || !newCoords || saving}
                loading={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
