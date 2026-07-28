import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { FloatingButton } from './FloatingButton';

export const BackButton = () => {
  const { theme } = useThemeMode();

  return (
    <FloatingButton onPress={() => router.back()}>
      <MaterialCommunityIcons name="arrow-left" color={theme.colors.text} size={26} />
    </FloatingButton>
  );
};
