import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'customer' | 'provider';

const ROLE_KEY = 'ustaz_user_role';
const ONBOARDING_KEY = 'ustaz_onboarded';

export async function getStoredRole(): Promise<UserRole | null> {
  const role = await AsyncStorage.getItem(ROLE_KEY);
  return role === 'customer' || role === 'provider' ? role : null;
}

export async function setStoredRole(role: UserRole): Promise<void> {
  await AsyncStorage.setItem(ROLE_KEY, role);
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function clearRole(): Promise<void> {
  await AsyncStorage.removeItem(ROLE_KEY);
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
  await AsyncStorage.removeItem(ROLE_KEY);
}
