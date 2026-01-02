import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

type Props = {
  size: number;
  startIndex: number;
  orientation: 'horizontal' | 'vertical';
  cellSize: number;
  onPress?: () => void;
  onLongPress?: () => void;
  color?: string;
};

export default function Ship({ size, startIndex, orientation, cellSize, onPress, onLongPress, color = '#666' }: Props) {
  const row = Math.floor(startIndex / 10);
  const col = startIndex % 10;
  const width = orientation === 'horizontal' ? cellSize * size : cellSize;
  const height = orientation === 'vertical' ? cellSize * size : cellSize;
  const left = col * cellSize;
  const top = row * cellSize;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { left, top, width, height }]}
    >
      <View style={[styles.ship, { backgroundColor: color, width: '100%', height: '100%' }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ship: {
    opacity: 0.9,
  },
});
