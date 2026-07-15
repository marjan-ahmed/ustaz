import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#1B1B27" />
          </Pressable>
          <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27', marginLeft: 12 }}>Saved Addresses</Text>
        </View>
        <Pressable onPress={() => setShowAdd(true)}
          style={{ padding: 8, borderRadius: 10, backgroundColor: `${colors.primary}10` }}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="location-outline" size={64} color="#D1D5DB" />
          <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#9CA3AF', marginTop: 16 }}>No saved addresses</Text>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#D1D5DB', marginTop: 8, textAlign: 'center' }}>
            Save your frequently used addresses for faster booking
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {addresses.map((addr) => (
            <Pressable key={addr.id} onPress={() => bookAtAddress(addr)}
              style={{ padding: 14, borderRadius: 16, backgroundColor: addr.is_default ? '#FFF7ED' : '#F9FAFB', borderWidth: 1, borderColor: addr.is_default ? '#FDBA74' : '#F3F4F6', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={addr.is_default ? 'home' : 'location'} size={16} color={addr.is_default ? colors.primary : '#6B7280'} />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>{addr.label}</Text>
                    {addr.is_default && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.primary }}>
                        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#6B7280', marginTop: 4 }} numberOfLines={1}>{addr.address}</Text>
                  {addr.landmark && (
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#D97706', marginTop: 2 }}>
                      <Ionicons name="flag" size={10} color="#D97706" /> {addr.landmark}
                    </Text>
                  )}
                  {/* Service history summary */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF' }}>
                      {addr.total_services} service{addr.total_services !== 1 ? 's' : ''}
                    </Text>
                    {addr.last_service_date && (
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF' }}>
                        Last: {new Date(addr.last_service_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  {/* Recurring issues */}
                  {addr.recurring_issues && addr.recurring_issues.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {addr.recurring_issues.map((issue, i) => (
                        <View key={i} style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FEF2F2' }}>
                          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 9, color: '#EF4444', fontWeight: '700' }}>
                            Recurring: {issue}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Pressable onPress={() => deleteAddress(addr.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={16} color="#D1D5DB" />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Add Address Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 20, color: '#1B1B27' }}>Add Address</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Label</Text>
                <TextInput value={newLabel} onChangeText={setNewLabel}
                  placeholder="e.g. Home, Office, Mom's house" placeholderTextColor="#D1D5DB"
                  style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#1B1B27' }} />
              </View>

              <View>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Address</Text>
                <TextInput value={newAddress} onChangeText={setNewAddress}
                  placeholder="Full address" placeholderTextColor="#D1D5DB"
                  style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#1B1B27' }} />
              </View>

              <View>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Landmark (optional)</Text>
                <TextInput value={newLandmark} onChangeText={setNewLandmark}
                  placeholder="Nearby landmark" placeholderTextColor="#D1D5DB"
                  style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#1B1B27' }} />
              </View>

              <Pressable onPress={getCurrentLocationForNew} disabled={gettingLocation}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6' }}>
                {gettingLocation ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Ionicons name="locate" size={16} color={colors.primary} />
                )}
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: gettingLocation ? '#9CA3AF' : colors.primary }}>
                  {gettingLocation ? 'Getting location...' : 'Use current location'}
                </Text>
              </Pressable>

              {newCoords && (
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#10B981', textAlign: 'center' }}>
                  Location captured: {newCoords.lat.toFixed(4)}, {newCoords.lng.toFixed(4)}
                </Text>
              )}

              <Pressable onPress={saveAddress} disabled={saving || !newLabel.trim() || !newAddress.trim() || !newCoords}
                style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                  backgroundColor: (!newLabel.trim() || !newAddress.trim() || !newCoords || saving) ? '#D1D5DB' : colors.primary }}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Save Address</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
