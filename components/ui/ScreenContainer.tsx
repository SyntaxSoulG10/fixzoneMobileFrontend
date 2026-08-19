import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  disableKeyboardDismiss?: boolean;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  scrollable = true,
  disableKeyboardDismiss = false,
}) => {
  const content = (
    <View style={[styles.inner, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        {scrollable ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={disableKeyboardDismiss ? undefined : Keyboard.dismiss}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : disableKeyboardDismiss ? (
          <View style={{ flex: 1 }}>{content}</View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>{content}</View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
});


export default ScreenContainer;
