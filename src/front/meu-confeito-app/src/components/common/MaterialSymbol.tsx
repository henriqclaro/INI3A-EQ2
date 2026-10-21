import { memo } from 'react';
import { ColorValue, StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { MaterialSymbolName } from '@/src/types/materialSymbols';

export interface MaterialSymbolProps extends Omit<TextProps, 'children'> {
  name: MaterialSymbolName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
}

export const MaterialSymbol = memo(
  ({
    name,
    size = 24,
    color,
    style,
    allowFontScaling = false,
    selectable = false,
    ...rest
  }: MaterialSymbolProps) => {
    return (
      <Text
        allowFontScaling={allowFontScaling}
        selectable={selectable}
        style={[
          styles.symbol,
          {
            fontSize: size,
            lineHeight: size,
            color,
          },
          style,
        ]}
        {...rest}
      >
        {name}
      </Text>
    );
  },
);

MaterialSymbol.displayName = 'MaterialSymbol';

const styles = StyleSheet.create({
  symbol: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    textDecorationLine: 'none',
  },
});
