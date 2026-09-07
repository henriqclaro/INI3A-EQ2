import { ReactNode, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

export interface FloatingActionItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'neutral';
  accessibilityLabel?: string;
}

interface FloatingButtonProps {
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'neutral';
  actions?: FloatingActionItem[];
  isOpen?: boolean;
  onToggleOpen?: (isOpen: boolean) => void;
  accessibilityLabel?: string;
}

export const FloatingButton = ({
  onPress,
  children,
  containerStyle,
  style,
  variant = 'primary',
  actions,
  isOpen,
  onToggleOpen,
  accessibilityLabel,
}: FloatingButtonProps) => {
  const { theme } = useThemeMode();
  const [isInternalOpen, setIsInternalOpen] = useState(false);

  const hasActions = Boolean(actions && actions.length > 0);
  const isExpanded = isOpen !== undefined ? isOpen : isInternalOpen;

  const setExpanded = (nextState: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(nextState);
    } else {
      setIsInternalOpen(nextState);
    }
  };

  const handleMainPress = (event: GestureResponderEvent) => {
    if (hasActions) {
      setExpanded(!isExpanded);
    } else if (onPress) {
      onPress(event);
    }
  };

  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  return (
    <View style={[styles.btnContainer, containerStyle]}>
      {hasActions && isExpanded && (
        <View style={styles.actionsWrapper}>
          {actions!.map((action) => {
            const isSecondary = action.variant === 'secondary';
            const iconColor = isSecondary ? theme.colors.text : theme.colors.secondaryText;
            const actionBg = isSecondary ? theme.colors.secondary : theme.colors.primary;

            return (
              <TouchableOpacity
                key={action.id}
                style={styles.actionRow}
                onPress={() => {
                  setExpanded(false);
                  action.onPress();
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel || action.label}
              >
                <View style={styles.actionLabelPill}>
                  <Text style={styles.actionLabelText}>{action.label}</Text>
                </View>
                <View style={[styles.actionMiniFab, { backgroundColor: actionBg }]}>
                  <MaterialCommunityIcons name={action.icon} size={22} color={iconColor} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handleMainPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel || (isExpanded ? 'Fechar menu de ações' : 'Ações de receita')
        }
      >
        {hasActions ? (
          isExpanded ? (
            <MaterialCommunityIcons
              name="close"
              size={26}
              color={variant === 'secondary' ? theme.colors.text : theme.colors.secondaryText}
            />
          ) : (
            children || (
              <MaterialCommunityIcons
                name="chef-hat"
                size={26}
                color={variant === 'secondary' ? theme.colors.text : theme.colors.secondaryText}
              />
            )
          )
        ) : (
          children
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: AppTheme, variant?: 'primary' | 'secondary' | 'neutral') =>
  StyleSheet.create({
    btnContainer: {
      position: 'absolute',
      alignItems: 'flex-end',
      zIndex: 50,
    },
    actionsWrapper: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 12,
      marginBottom: 12,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
    },
    actionLabelPill: {
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 9999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      ...Platform.select({
        android: {
          elevation: 3,
        },
        default: {
          shadowColor: '#40242B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        },
      }),
    },
    actionLabelText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    actionMiniFab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        default: {
          shadowColor: '#40242B',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
      }),
    },
    button: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        variant === 'secondary'
          ? theme.colors.secondary
          : variant === 'neutral'
            ? theme.colors.background
            : theme.colors.primary,
      borderWidth: 1,
      borderColor:
        variant === 'secondary'
          ? theme.colors.secondary
          : variant === 'neutral'
            ? theme.colors.secBorder
            : theme.colors.primary,
      borderRadius: 28,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        default: {
          shadowColor: '#40242B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.16,
          shadowRadius: 8,
        },
      }),
    },
  });
