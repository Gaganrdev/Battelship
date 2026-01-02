import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, PanResponder, Vibration } from 'react-native';

type Props = {
  size: number;
  startIndex: number;
  orientation: 'horizontal' | 'vertical';
  cellSize: number;
  onPress?: () => void; // tap to toggle orientation
  onDragStart?: () => void;
  onDrop?: (newStartIndex: number) => void;
  color?: string;
  selected?: boolean;
};

export default function Ship({ size, startIndex, orientation, cellSize, onPress, onDragStart, onDrop, color = '#666', selected = false }: Props) {
  const row = Math.floor(startIndex / 10);
  const col = startIndex % 10;
  const width = orientation === 'horizontal' ? cellSize * size : cellSize;
  const height = orientation === 'vertical' ? cellSize * size : cellSize;
  const left = col * cellSize;
  const top = row * cellSize;

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [isDragging, setIsDragging] = useState(false);
  const dragStartTime = useRef(0);
  const dragDistance = useRef(0);

  useEffect(() => {
    // reset position when startIndex/orientation changes
    pan.setValue({ x: 0, y: 0 });
    setIsDragging(false);
    dragDistance.current = 0;
  }, [startIndex, orientation, size]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const distance = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
        return distance > 5;
      },
      onPanResponderGrant: () => {
        dragStartTime.current = Date.now();
        dragDistance.current = 0;
        setIsDragging(true);
        pan.setOffset({ x: (pan.x as any)._value ?? 0, y: (pan.y as any)._value ?? 0 });
        pan.setValue({ x: 0, y: 0 });
        Vibration.vibrate(30);
        if (onDragStart) onDragStart();
      },
      onPanResponderMove: (e, gestureState) => {
        dragDistance.current = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        const dragDuration = Date.now() - dragStartTime.current;
        const wasTap = dragDuration < 200 && dragDistance.current < 10;
        
        pan.flattenOffset();
        setIsDragging(false);
        
        if (wasTap) {
          // This was a tap, trigger orientation toggle
          Vibration.vibrate(20);
          if (onPress) onPress();
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        } else {
          // This was a drag, compute drop cell
          const finalLeft = left + gesture.dx;
          const finalTop = top + gesture.dy;
          const newCol = Math.round(finalLeft / cellSize);
          const newRow = Math.round(finalTop / cellSize);
          const boundedCol = Math.max(0, Math.min(9, newCol));
          const boundedRow = Math.max(0, Math.min(9, newRow));
          const newStart = boundedRow * 10 + boundedCol;
          if (onDrop) onDrop(newStart);
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        { left, top, width, height },
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        selected ? styles.selected : null,
        isDragging ? styles.dragging : null,
      ]}
    >
      <View style={[styles.ship, { backgroundColor: color, width: '100%', height: '100%' }]} />
    </Animated.View>
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
  selected: {
    borderWidth: 2,
    borderColor: '#0af',
  },
  dragging: {
    opacity: 0.8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
