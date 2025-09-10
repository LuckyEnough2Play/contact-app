// Ensure gesture handler is initialized before any React component mounts.
import 'react-native-gesture-handler';
import React from 'react';
import RootErrorBoundary from './src/components/RootErrorBoundary';

// Global JS error hook: log instead of silent kill
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any)?.ErrorUtils?.setGlobalHandler?.((e: any, isFatal?: boolean) => {
  console.error('GlobalErrorHandler', e, { isFatal });
});

function Wrapped() {
  const Entry = require('expo-router/entry').default;
  return (
    <RootErrorBoundary>
      <Entry />
    </RootErrorBoundary>
  );
}

export default Wrapped;
