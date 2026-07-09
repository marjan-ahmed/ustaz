import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PROVIDER_MIN_WALLET_BALANCE } from '@ustaz/shared';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { createTopupRequest, getWallet, uploadTopupReceipt } from '@/lib/ustaz-api';

const PACKAGES = [
  { id: 'starter', label: 'Starter', amount: 500, tag: 'Just testing', icon: 'flash' as const, color: '#F59E0B' },
  { id: 'standard', label: 'Standard', amount: 1000, tag: 'Regular work', icon: 'briefcase' as const, color: colors.primary, popular: true },
  { id: 'pro', label: 'Pro', amount: 2000, tag: 'Full-time', icon: 'star' as const, color: '#8B5CF6' },
];

const BANK = {
  easypaisa: { label: 'Easypaisa', number: '0305-1126649', name: 'Ustaz Platform' },
  jazzcash: { label: 'JazzCash', number: '0305-1126649', name: 'Ustaz Platform' },
  bank: { label: 'Bank', number: '0012-3456-7890', name: 'USTAZ', bankName: 'Alfalah Islamic Bank' },
};

const fmt = (n: number) => `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function WalletScreen() {
  const { user, loading: authLoading, isSignedIn } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTopup, setShowTopup] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try { setWallet(await getWallet(user.id)); }
    catch (err: any) { setError(err?.message ?? 'Could not load wallet.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      setReceiptFile(result.assets[0]);
    }
  }

  function copyText(text: string, field: string) {
    Clipboard.setString(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function resetTopup() {
    setSelectedPkg(null);
    setTransactionId('');
    setReceiptUri(null);
    setReceiptFile(null);
    setShowTopup(false);
  }

  async function submitTopup() {
    if (!selectedPkg || !receiptFile || !transactionId.trim() || !user) {
      Alert.alert('Missing info', 'Select a package, enter transaction ID, and upload your receipt.');
      return;
    }
    setSubmitting(true); setError(null);
    try {
      const pkg = PACKAGES.find((p) => p.id === selectedPkg)!;
      const upload = await uploadTopupReceipt({
        providerId: user.id,
        uri: receiptFile.uri,
        fileName: receiptFile.fileName,
        mimeType: receiptFile.mimeType,
      });

      await createTopupRequest({
        providerId: user.id,
        amountSent: pkg.amount,
        transactionId: transactionId.trim(),
        receiptUrl: upload.url,
      });

      Alert.alert('Submitted', 'Top-up request submitted! Admin will verify and credit your wallet.');
      resetTopup();
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  }

  if (authLoading || !isSignedIn) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></SafeAreaView>;

  const transactions = wallet?.recent_transactions ?? [];
  const pendingTopups = wallet?.pending_topups ?? [];
  const activeBank = BANK[activeMethod];
  const selectedPkgData = PACKAGES.find((p) => p.id === selectedPkg);
  const balance = Number(wallet?.balance ?? 0);
  const isBelowMinimum = balance < PROVIDER_MIN_WALLET_BALANCE;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27', marginBottom: 20 }}>Wallet</Text>

        {error ? <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: '#FEF2F2', padding: 16 }}><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444' }}>{error}</Text></View> : null}

        {/* Balance Card */}
        <View style={{ marginBottom: 20, borderRadius: 20, backgroundColor: '#1B1B27', padding: 24, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)' }}>Current balance</Text>
          <Text style={{ fontFamily: 'Anton', fontSize: 36, color: '#FFFFFF', marginTop: 8 }}>{fmt(balance)}</Text>
          {isBelowMinimum && (
            <View style={{ marginTop: 16, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.16)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.28)', padding: 12 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#FCA5A5' }}>Minimum balance required</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                Keep at least {fmt(PROVIDER_MIN_WALLET_BALANCE)} to receive or accept service requests.
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
            <View style={{ flex: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', padding: 12 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Total earned</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 4 }}>{fmt(Number(wallet?.total_earned ?? 0))}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', padding: 12 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Commission paid</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 4 }}>{fmt(Number(wallet?.total_commission_paid ?? 0))}</Text>
            </View>
          </View>
        </View>

        {/* Top Up Button / Flow */}
        {!showTopup ? (
          <Pressable onPress={() => setShowTopup(true)}
            style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 16, shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Top Up Wallet</Text>
          </Pressable>
        ) : (
          <View style={{ marginBottom: 24, borderRadius: 20, backgroundColor: '#F9FAFB', padding: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27' }}>Top up wallet</Text>
              </View>
              <Pressable onPress={resetTopup} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={14} color="#6B7280" />
              </Pressable>
            </View>

            {/* Package selection */}
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 10 }}>Choose amount</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {PACKAGES.map((pkg) => (
                <Pressable key={pkg.id} onPress={() => setSelectedPkg(pkg.id)}
                  style={{ flex: 1, borderRadius: 14, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 2, borderColor: selectedPkg === pkg.id ? pkg.color : '#F3F4F6', alignItems: 'center' }}>
                  <Ionicons name={pkg.icon} size={20} color={pkg.color} />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#1B1B27', marginTop: 6 }}>{pkg.label}</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{pkg.tag}</Text>
                  <Text style={{ fontFamily: 'Anton', fontSize: 16, color: pkg.color, marginTop: 6 }}>{fmt(pkg.amount)}</Text>
                  {pkg.popular && <View style={{ position: 'absolute', top: -8, backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>POPULAR</Text></View>}
                  {selectedPkg === pkg.id && <View style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: pkg.color, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark" size={10} color="#FFF" /></View>}
                </Pressable>
              ))}
            </View>

            {selectedPkgData && (
              <>
                {/* Bank method tabs */}
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 10 }}>Send {fmt(selectedPkgData.amount)} to</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {(['easypaisa', 'jazzcash', 'bank'] as const).map((m) => (
                    <Pressable key={m} onPress={() => setActiveMethod(m)}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: activeMethod === m ? '#1B1B27' : '#FFFFFF', borderWidth: 1, borderColor: activeMethod === m ? '#1B1B27' : '#F3F4F6', alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: activeMethod === m ? '#FFFFFF' : '#6B7280' }}>{m === 'easypaisa' ? 'Easypaisa' : m === 'jazzcash' ? 'JazzCash' : 'Bank'}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Bank details */}
                <View style={{ borderRadius: 14, backgroundColor: '#FFFFFF', padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16 }}>
                  {activeMethod !== 'bank' ? (
                    <>
                      <BankRow label={`${activeBank.label} Number`} value={activeBank.number} field="number" copied={copiedField} onCopy={copyText} />
                      <BankRow label="Account Name" value={activeBank.name} field="name" copied={copiedField} onCopy={copyText} />
                    </>
                  ) : (
                    <>
                      <BankRow label="Bank Name" value={BANK.bank.bankName} field="bankName" copied={copiedField} onCopy={copyText} />
                      <BankRow label="Account Title" value={BANK.bank.name} field="title" copied={copiedField} onCopy={copyText} />
                      <BankRow label="Account Number" value={BANK.bank.number} field="accNum" copied={copiedField} onCopy={copyText} />
                    </>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 10 }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF' }}>Amount to send</Text>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: colors.primary }}>{fmt(selectedPkgData.amount)}</Text>
                  </View>
                </View>

                {/* Transaction ID */}
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>Transaction ID / TRX Ref</Text>
                <TextInput value={transactionId} onChangeText={setTransactionId} placeholder="e.g. TRX-1234567890" placeholderTextColor="#D1D5DB"
                  style={{ minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 16, fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#1B1B27', marginBottom: 16 }} />

                {/* Receipt upload */}
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>Payment screenshot</Text>
                {receiptUri ? (
                  <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: `${colors.primary}30`, marginBottom: 16 }}>
                    <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#FFFFFF' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#6B7280' }}>Receipt attached</Text>
                      </View>
                      <Pressable onPress={() => { setReceiptUri(null); setReceiptFile(null); }}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={pickReceipt}
                    style={{ borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', padding: 24, alignItems: 'center', marginBottom: 16 }}>
                    <Ionicons name="image-outline" size={32} color="#D1D5DB" />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', marginTop: 8 }}>Tap to attach screenshot</Text>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>PNG / JPG</Text>
                  </Pressable>
                )}

                {/* Submit */}
                <Pressable onPress={submitTopup} disabled={!transactionId.trim() || !receiptFile || submitting}
                  style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: transactionId.trim() && receiptFile && !submitting ? colors.primary : '#D1D5DB' }}>
                  {submitting ? <ActivityIndicator color="#FFF" size="small" /> : (
                    <>
                      <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" />
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Submit Top-Up Request</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Pending top-ups */}
        {pendingTopups.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27', marginBottom: 10 }}>Top-up history</Text>
            <View style={{ gap: 8 }}>
              {pendingTopups.map((t: any) => (
                <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, backgroundColor: '#F9FAFB', padding: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
                  <View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>{fmt(t.amount_sent)}</Text>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>TX: {t.transaction_id} Â· {new Date(t.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.status === 'approved' ? '#D1FAE5' : t.status === 'rejected' ? '#FEE2E2' : '#FEF3C7' }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: t.status === 'approved' ? '#10B981' : t.status === 'rejected' ? '#EF4444' : '#F59E0B' }}>{t.status.charAt(0).toUpperCase() + t.status.slice(1)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <View>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27', marginBottom: 10 }}>Recent transactions</Text>
            <View style={{ gap: 8 }}>
              {transactions.map((tx: any) => (
                <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tx.amount > 0 ? '#ECFDF5' : '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={tx.amount > 0 ? 'trending-up' : 'trending-down'} size={16} color={tx.amount > 0 ? '#10B981' : '#EF4444'} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#1B1B27' }}>{tx.description ?? tx.type ?? 'Transaction'}</Text>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#D1D5DB', marginTop: 2 }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ''}</Text>
                  </View>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: tx.amount > 0 ? '#10B981' : '#EF4444' }}>
                    {tx.amount > 0 ? '+' : ''} {fmt(Math.abs(Number(tx.amount ?? 0)))}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BankRow({ label, value, field, copied, onCopy }: { label: string; value: string; field: string; copied: string | null; onCopy: (v: string, f: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#1B1B27' }}>{value}</Text>
        <Pressable onPress={() => onCopy(value, field)}>
          <Ionicons name={copied === field ? 'checkmark' : 'copy-outline'} size={14} color={copied === field ? '#10B981' : '#9CA3AF'} />
        </Pressable>
      </View>
    </View>
  );
}

