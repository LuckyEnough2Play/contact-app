import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  viewportHeight: number;
  contentHeight: number;
  scrollOffset: number;
  trackThickness?: number; // default 2
  thumbDiameter?: number; // default 6
  trackColor?: string; // default '#E5E7EB'
  thumbColor?: string; // default '#03A9F4'
  rightOffset?: number; // default 2
}

export default function ScrollIndicator({
  viewportHeight,
  contentHeight,
  scrollOffset,
  trackThickness = 2,
  thumbDiameter = 6,
  trackColor = '#E5E7EB',
  thumbColor = '#03A9F4',
  rightOffset = 2,
}: Props) {
  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  if (viewportHeight <= 0 || contentHeight <= viewportHeight + 0.5) return null;

  const clampedOffset = Math.max(0, Math.min(scrollOffset, maxScroll));
  const progress = maxScroll === 0 ? 0 : clampedOffset / maxScroll; // 0..1

  const radius = thumbDiameter / 2;
  const travel = Math.max(0, viewportHeight - thumbDiameter);
  const thumbTop = progress * travel;

  return (
    <View pointerEvents="none" style={[styles.wrapper, { height: viewportHeight, right: rightOffset, width: Math.max(trackThickness, thumbDiameter) }]}> 
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: trackThickness,
          backgroundColor: trackColor,
          borderRadius: trackThickness / 2,
          alignSelf: 'flex-end',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: thumbTop,
          right: -((thumbDiameter - trackThickness) / 2),
          width: thumbDiameter,
          height: thumbDiameter,
          backgroundColor: thumbColor,
          borderRadius: radius,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});

