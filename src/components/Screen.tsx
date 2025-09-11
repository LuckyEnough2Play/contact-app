import React from 'react';
import { Platform, View, ScrollView, KeyboardAvoidingView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  footer?: React.ReactNode; // optional pinned bottom (uses insets internally)
  padding?: number; // default 16
};

export default function Screen({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  footer,
  padding = 16,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const basePaddingTop = insets.top + padding;
  const basePaddingBottom = insets.bottom + padding;

  const Body = scroll ? ScrollView : View;

  const bodyProps = scroll
    ? {
        contentContainerStyle: [
          {
            paddingTop: basePaddingTop,
            paddingBottom: footer ? padding : basePaddingBottom,
            paddingHorizontal: padding,
          },
          contentContainerStyle,
        ],
      }
    : {
        style: [
          {
            flex: 1,
            paddingTop: basePaddingTop,
            paddingBottom: footer ? padding : basePaddingBottom,
            paddingHorizontal: padding,
          },
          style,
        ],
      };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* @ts-ignore */}
      <Body {...bodyProps}>{children}</Body>

      {footer ? (
        <View
          style={{
            paddingHorizontal: padding,
            paddingBottom: insets.bottom + padding,
            paddingTop: 8,
            backgroundColor: 'white',
          }}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

