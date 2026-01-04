import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, PanResponder, Vibration, Text } from 'react-native';

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
  id?: number; // Add ship ID for debugging
};

export default function Ship({ size, startIndex, orientation, cellSize, onPress, onDragStart, onDrop, color = '#666', selected = false, id }: Props) {
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
    // IMPORTANT: Reset both value AND offset to prevent invisible ships
    console.log('Ship ID', id, '(size', size, ') reset at index', startIndex, 'orientation', orientation, 'left:', left, 'top:', top);
    pan.setOffset({ x: 0, y: 0 });
    pan.setValue({ x: 0, y: 0 });
    setIsDragging(false);
    dragDistance.current = 0;
  }, [startIndex, orientation, size]); // Don't include pan in deps

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
        
        // Immediately flatten and reset to prevent offset accumulation
        pan.flattenOffset();
        
        setIsDragging(false);
        
        if (wasTap) {
          // This was a tap, trigger orientation toggle
          Vibration.vibrate(20);
          pan.setValue({ x: 0, y: 0 });
          if (onPress) {
            console.log('Tap to toggle orientation for ship ID', id, 'at index', startIndex);
            onPress();
          }
        } else {
          // This was a drag, compute drop cell
          const finalLeft = left + gesture.dx;
          const finalTop = top + gesture.dy;
          const newCol = Math.round(finalLeft / cellSize);
          const newRow = Math.round(finalTop / cellSize);
          const boundedCol = Math.max(0, Math.min(9, newCol));
          const boundedRow = Math.max(0, Math.min(9, newRow));
          const newStart = boundedRow * 10 + boundedCol;
          
          console.log('Drop ship ID', id, 'from', startIndex, 'to', newStart, 'dx:', gesture.dx, 'dy:', gesture.dy);
          
          // CRITICAL: Reset pan BEFORE calling onDrop
          pan.setValue({ x: 0, y: 0 });
          
          if (onDrop) {
            onDrop(newStart);
          }
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
      {/* Debug: Show ship ID when selected */}
      {selected && <View style={{ position: 'absolute', top: 2, left: 2, backgroundColor: 'white', padding: 2, borderRadius: 2 }}><Text style={{ fontSize: 8 }}>ID:{startIndex}</Text></View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 2,
    borderRadius: 4,
    overflow: 'visible', // Changed from 'hidden' to allow shadow to show
  },
  ship: {
    opacity: 0.9,
    borderRadius: 4,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#0af',
    zIndex: 999, // Ensure selected ship is on top
  },
  dragging: {
    opacity: 0.8,
    elevation: 10,
    zIndex: 999, // Ensure dragging ship is on top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
