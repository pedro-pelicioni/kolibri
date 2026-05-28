import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlantPassport } from '../types/passport';

// Centralised stack param list — keeps every navigation call typed.
export type RootStackParamList = {
  login: undefined;
  home: undefined;
  create: undefined;
  passport: { passport: PlantPassport };
  scanner: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
