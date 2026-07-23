import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Image, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PROVIDER_MIN_WALLET_BALANCE } from '@ustaz/shared';
import { useAuth } from '@/lib/useAuth';
import { createTopupRequest, getWallet, uploadTopupReceipt } from '@/lib/ustaz-api';
import {
  Badge, Button, Card, FadeInUp, GlowBackdrop, IsoWalletScene, LottieScene, NumberTicker, Numeric, PressableScale, Screen, SectionHeader, Stagger, Text, TextField, lottieSources,
} from '@/components/mobile-ui';
import { color, font, gradient, radius, shadow, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const PACKAGES = [
  { id: 'starter', label: 'Starter', amount: 500, tag: 'Just testing', icon: 'flash' as const, accent: '#F59E0B' },
  { id: 'standard', label: 'Standard', amount: 1000, tag: 'Regular work', icon: 'briefcase' as const, accent: color.primary, popular: true },
  { id: 'pro', label: 'Pro', amount: 2000, tag: 'Full-time', icon: 'star' as const, accent: '#8B5CF6' },
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
  const [topupSuccess, setTopupSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try { setWallet(await getWallet(user.id)); }
    catch (err: any) { setError(err?.message ?? 'Could not load wallet.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  async function pickReceipt() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setReceiptUri(result.assets[0].uri);
        setReceiptFile(result.assets[0]);
      }
    } catch {}
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
      const pkg = PACKAGES.find((p) => p.id === selectedPkg);
      if (!pkg) { Alert.alert('Error', 'Invalid package selected.'); return; }
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

      resetTopup();
      load();
      setTopupSuccess(true);
      setTimeout(() => setTopupSuccess(false), 3200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  }

  if (authLoading || !isSignedIn) {
    return (
      <Screen bg={color.white}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      </Screen>
    );
  }

  const transactions = wallet?.recent_transactions ?? [];
  const pendingTopups = wallet?.pending_topups ?? [];
  const activeBank = BANK[activeMethod];
  const selectedPkgData = PACKAGES.find((p) => p.id === selectedPkg);
  const balance = Number(wallet?.balance ?? 0);
  const isBelowMinimum = balance < PROVIDER_MIN_WALLET_BALANCE;

  return (
    <Screen bg={color.white} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <FadeInUp>
          <Text variant="h1" style={{ marginBottom: space.xl }}>Wallet</Text>
        </FadeInUp>

        {error && (
          <FadeInUp>
            <Card variant="flat" style={{ marginBottom: space.md, backgroundColor: color.errorBg }}>
              <Text variant="label" style={{ color: color.error }}>{error}</Text>
            </Card>
          </FadeInUp>
        )}

        {topupSuccess && (
          <FadeInUp>
            <Card variant="elevated" style={{ marginBottom: space.md, alignItems: 'center' }}>
              <LottieScene source={lottieSources.walletTopupSuccess} size={120} loop={false} />
              <Text variant="bodyLg" style={{ fontWeight: '700', marginTop: space.xs }}>Top-up request submitted!</Text>
              <Text variant="label" tone="muted" center>Admin will verify and credit your wallet.</Text>
            </Card>
          </FadeInUp>
        )}

        {/* Balance Card - Navy hero */}
        <FadeInUp delay={60}>
          <View style={{ borderRadius: radius['2xl'], overflow: 'hidden', marginBottom: space.xl, ...shadow.brand }}>
            <LinearGradient colors={gradient.navy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: space.xl }}>
              <GlowBackdrop top={-60} right={-40} size={200} opacity={0.25} />
              <GlowBackdrop color={color.primaryLight} bottom={-40} left={-20} size={160} opacity={0.12} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" tone="inverseSoft" style={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    Current balance
                  </Text>
                  <NumberTicker
                    value={balance}
                    formatter={fmt}
                    style={{ fontFamily: font.numeric, fontSize: 36, color: color.white, marginTop: space.sm }}
                  />
                </View>
                <IsoWalletScene size={90} />
              </View>
              {isBelowMinimum && (
                <View style={{ marginTop: space.md, borderRadius: radius.md, backgroundColor: 'rgba(239,68,68,0.18)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.28)', padding: space.sm }}>
                  <Text variant="caption" style={{ color: '#FCA5A5', fontWeight: '700' }}>Minimum balance required</Text>
                  <Text variant="caption" tone="inverseSoft" style={{ marginTop: space.xs }}>
                    Keep at least {fmt(PROVIDER_MIN_WALLET_BALANCE)} to receive or accept service requests.
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xl }}>
                <View style={{ flex: 1, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)', padding: space.md }}>
                  <Text variant="caption" tone="inverseSoft">Total earned</Text>
                  <Text variant="bodyLg" tone="inverse" style={{ fontWeight: '700', marginTop: space.xs }}>{fmt(Number(wallet?.total_earned ?? 0))}</Text>
                </View>
                <View style={{ flex: 1, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)', padding: space.md }}>
                  <Text variant="caption" tone="inverseSoft">Commission paid</Text>
                  <Text variant="bodyLg" tone="inverse" style={{ fontWeight: '700', marginTop: space.xs }}>{fmt(Number(wallet?.total_commission_paid ?? 0))}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </FadeInUp>

        {/* Top Up Button / Flow */}
        {!showTopup ? (
          <FadeInUp delay={100}>
            <Button label="Top Up Wallet" variant="primary" icon={<Ionicons name="add-circle" size={20} color={color.white} />} onPress={() => setShowTopup(true)} />
          </FadeInUp>
        ) : (
          <FadeInUp delay={100}>
            <Card variant="elevated" style={{ marginBottom: space.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Ionicons name="wallet" size={20} color={color.primary} />
                  <Text variant="bodyLg" style={{ fontWeight: '700' }}>Top up wallet</Text>
                </View>
                <PressableScale onPress={resetTopup} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={14} color={color.inkMuted} />
                </PressableScale>
              </View>

              {/* Package selection */}
              <Text variant="label" tone="muted" style={{ marginBottom: space.sm, fontWeight: '700' }}>Choose amount</Text>
              <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
                {PACKAGES.map((pkg) => {
                  const isActive = selectedPkg === pkg.id;
                  return (
                    <PressableScale key={pkg.id} onPress={() => setSelectedPkg(pkg.id)}>
                      <Card variant={isActive ? 'elevated' : 'flat'} padded={false} style={{ flex: 1, padding: space.md, alignItems: 'center', borderWidth: 2, borderColor: isActive ? pkg.accent : color.line }}>
                        <Ionicons name={pkg.icon} size={20} color={pkg.accent} />
                        <Text variant="caption" style={{ fontWeight: '700', marginTop: space.xs }}>{pkg.label}</Text>
                        <Text variant="caption" tone="muted">{pkg.tag}</Text>
                        <Numeric size={16} tone="ink" style={{ marginTop: space.xs }}>{fmt(pkg.amount)}</Numeric>
                        {pkg.popular && <Badge label="POPULAR" tone="primary" />}
                        {isActive && <Ionicons name="checkmark-circle" size={18} color={pkg.accent} style={{ position: 'absolute', top: 8, right: 8 }} />}
                      </Card>
                    </PressableScale>
                  );
                })}
              </View>

              {selectedPkgData && (
                <>
                  {/* Bank method tabs */}
                  <Text variant="label" tone="muted" style={{ marginBottom: space.sm, fontWeight: '700' }}>Send {fmt(selectedPkgData.amount)} to</Text>
                  <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
                    {(['easypaisa', 'jazzcash', 'bank'] as const).map((m) => (
                      <PressableScale key={m} onPress={() => setActiveMethod(m)}>
                        <View style={{ flex: 1, paddingVertical: space.sm, borderRadius: radius.md, backgroundColor: activeMethod === m ? color.navy : color.surface, borderWidth: 1, borderColor: activeMethod === m ? color.navy : color.line, alignItems: 'center', paddingHorizontal: space.md }}>
                          <Text variant="caption" style={{ fontWeight: '700', color: activeMethod === m ? color.white : color.inkMuted }}>{m === 'easypaisa' ? 'Easypaisa' : m === 'jazzcash' ? 'JazzCash' : 'Bank'}</Text>
                        </View>
                      </PressableScale>
                    ))}
                  </View>

                  {/* Bank details */}
                  <Card variant="flat" style={{ marginBottom: space.lg }}>
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: color.line, paddingTop: space.sm, marginTop: space.sm }}>
                      <Text variant="caption" tone="muted">Amount to send</Text>
                      <Text variant="body" style={{ fontWeight: '700', color: color.primary }}>{fmt(selectedPkgData.amount)}</Text>
                    </View>
                  </Card>

                  {/* Transaction ID */}
                  <View style={{ marginBottom: space.lg }}>
                    <TextField label="Transaction ID / TRX Ref" value={transactionId} onChangeText={setTransactionId} placeholder="e.g. TRX-1234567890" />
                  </View>

                  {/* Receipt upload */}
                  <Text variant="label" tone="muted" style={{ marginBottom: space.sm, fontWeight: '700' }}>Payment screenshot</Text>
                  {receiptUri ? (
                    <Card variant="flat" style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 2, borderColor: `${color.primary}30`, marginBottom: space.lg }}>
                      <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                          <Ionicons name="checkmark-circle" size={16} color={color.success} />
                          <Text variant="caption" tone="muted">Receipt attached</Text>
                        </View>
                        <PressableScale onPress={() => { setReceiptUri(null); setReceiptFile(null); }}>
                          <Ionicons name="close-circle" size={20} color={color.error} />
                        </PressableScale>
                      </View>
                    </Card>
                  ) : (
                    <PressableScale onPress={pickReceipt}>
                      <Card variant="flat" style={{ borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: color.line, padding: space['2xl'], alignItems: 'center', marginBottom: space.lg }}>
                        <Ionicons name="image-outline" size={32} color={color.line} />
                        <Text variant="label" tone="muted" style={{ marginTop: space.sm, fontWeight: '700' }}>Tap to attach screenshot</Text>
                        <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>PNG / JPG</Text>
                      </Card>
                    </PressableScale>
                  )}

                  {/* Submit */}
                  <Button
                    label="Submit Top-Up Request"
                    variant="primary"
                    icon={<Ionicons name="arrow-up-circle" size={18} color={color.white} />}
                    onPress={submitTopup}
                    disabled={!transactionId.trim() || !receiptFile || submitting}
                    loading={submitting}
                  />
                </>
              )}
            </Card>
          </FadeInUp>
        )}

        {/* Pending top-ups */}
        {pendingTopups.length > 0 && (
          <FadeInUp delay={120}>
            <SectionHeader title="Top-up history" />
            <Stagger step={40}>
              {pendingTopups.map((t: any) => (
                <Card key={t.id} variant="elevated" padded={false} style={{ marginBottom: space.sm, padding: space.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text variant="bodyLg" style={{ fontWeight: '700' }}>{fmt(t.amount_sent)}</Text>
                      <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>TX: {t.transaction_id} · {new Date(t.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Badge
                      label={t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      tone={t.status === 'approved' ? 'success' : t.status === 'rejected' ? 'error' : 'warning'}
                    />
                  </View>
                </Card>
              ))}
            </Stagger>
          </FadeInUp>
        )}

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <FadeInUp delay={140}>
            <SectionHeader title="Recent transactions" />
            <Stagger step={40}>
              {transactions.map((tx: any) => (
                <Card key={tx.id} variant="elevated" padded={false} style={{ marginBottom: space.sm, padding: space.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: tx.amount > 0 ? color.successBg : color.errorBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={tx.amount > 0 ? 'trending-up' : 'trending-down'} size={16} color={tx.amount > 0 ? color.success : color.error} />
                    </View>
                    <View style={{ marginLeft: space.md, flex: 1 }}>
                      <Text variant="label" style={{ fontWeight: '700' }}>{tx.description ?? tx.type ?? 'Transaction'}</Text>
                      <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ''}</Text>
                    </View>
                    <Text variant="body" style={{ fontWeight: '700', color: tx.amount > 0 ? color.success : color.error }}>
                      {tx.amount > 0 ? '+' : ''} {fmt(Math.abs(Number(tx.amount ?? 0)))}
                    </Text>
                  </View>
                </Card>
              ))}
            </Stagger>
          </FadeInUp>
        )}
      </ScrollView>
    </Screen>
  );
}

function BankRow({ label, value, field, copied, onCopy }: { label: string; value: string; field: string; copied: string | null; onCopy: (v: string, f: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: color.line }}>
      <Text variant="caption" tone="muted">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Text variant="label" style={{ fontWeight: '700' }}>{value}</Text>
        <PressableScale onPress={() => onCopy(value, field)}>
          <Ionicons name={copied === field ? 'checkmark' : 'copy-outline'} size={14} color={copied === field ? color.success : color.inkMuted} />
        </PressableScale>
      </View>
    </View>
  );
}
