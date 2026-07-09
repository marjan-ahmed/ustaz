import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, Text, View, type PressableProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@ustaz/shared/theme';

type ScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}>;

export function Screen({ eyebrow, title, subtitle, dark = false, children }: ScreenProps) {
  return (
    <SafeAreaView className={dark ? 'flex-1 bg-ustaz-navy' : 'flex-1 bg-ustaz-cream'} edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-lg pb-3xl"
      >
        <View className="pt-lg pb-xl">
          {eyebrow ? (
            <View className={dark ? 'self-start rounded-full bg-white/10 px-md py-xs' : 'self-start rounded-full bg-white px-md py-xs'}>
              <Text className={dark ? 'font-atkinson text-xs font-bold uppercase tracking-widest text-white/80' : 'font-atkinson text-xs font-bold uppercase tracking-widest text-ustaz-primary'}>
                {eyebrow}
              </Text>
            </View>
          ) : null}
          <Text className={dark ? 'mt-md font-anton text-5xl leading-[56px] text-white' : 'mt-md font-anton text-5xl leading-[56px] text-ustaz-navy'}>
            {title}
          </Text>
          {subtitle ? (
            <Text className={dark ? 'mt-sm font-atkinson text-base leading-6 text-white/72' : 'mt-sm font-atkinson text-base leading-6 text-slate-700'}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PrimaryButton({ children, className = '', ...props }: PropsWithChildren<PressableProps & { className?: string }>) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-[52px] items-center justify-center rounded-full bg-ustaz-primary px-xl ${className}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 5 }]}
      {...props}
    >
      <Text className="font-atkinson text-base font-bold text-white">{children}</Text>
    </Pressable>
  );
}

export function SoftButton({ children, className = '', ...props }: PropsWithChildren<PressableProps & { className?: string }>) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-[52px] items-center justify-center rounded-full border border-orange-200 bg-white px-xl ${className}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      {...props}
    >
      <Text className="font-atkinson text-base font-bold text-ustaz-primary">{children}</Text>
    </Pressable>
  );
}

export function Card({ children, className = '', dark = false }: PropsWithChildren<{ className?: string; dark?: boolean }>) {
  return (
    <View
      className={`${dark ? 'bg-ustaz-navy' : 'bg-white'} rounded-[24px] p-lg ${className}`}
      style={{ shadowColor: dark ? colors.navy : colors.primary, shadowOpacity: dark ? 0.22 : 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4 }}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View className="mb-md mt-xl flex-row items-center justify-between">
      <Text className="font-atkinson text-xl font-bold text-slate-950">{title}</Text>
      {action ? <Text className="font-atkinson text-sm font-bold text-ustaz-primary">{action}</Text> : null}
    </View>
  );
}

export function Metric({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  return (
    <View className={dark ? 'flex-1 rounded-[18px] bg-white/10 p-md' : 'flex-1 rounded-[18px] bg-ustaz-cream p-md'}>
      <Text className={dark ? 'font-anton text-2xl text-white' : 'font-anton text-2xl text-ustaz-navy'}>{value}</Text>
      <Text className={dark ? 'mt-xs font-atkinson text-xs leading-4 text-white/70' : 'mt-xs font-atkinson text-xs leading-4 text-slate-600'}>{label}</Text>
    </View>
  );
}

export function StepDot({ value, active = false }: { value: string; active?: boolean }) {
  return (
    <View className={active ? 'h-10 w-10 items-center justify-center rounded-full bg-ustaz-primary' : 'h-10 w-10 items-center justify-center rounded-full bg-ustaz-creamAlt'}>
      <Text className={active ? 'font-atkinson text-sm font-bold text-white' : 'font-atkinson text-sm font-bold text-ustaz-primary'}>{value}</Text>
    </View>
  );
}
