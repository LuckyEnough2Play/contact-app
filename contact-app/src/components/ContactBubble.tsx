import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Contact } from '../lib/types';

interface Props {
  contact: Contact;
}

export default function ContactBubble({ contact }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x, dy: pan.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: () => {},
    })
  ).current;

  return (
    <Animated.View {...panResponder.panHandlers} style={[styles.bubble, pan.getLayout()]}>
      <Svg height={80} width={80}>
        <Circle cx={40} cy={40} r={36} fill="#76c5ce" />
        <SvgText
          x={40}
          y={45}
          fill="white"
          fontSize="12"
          textAnchor="middle"
        >
          {contact.name}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
  },
});
