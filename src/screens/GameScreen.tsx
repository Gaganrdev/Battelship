import { View, Text, StyleSheet } from 'react-native';

export default function GameScreen({ route }: any) {
  const { mode } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {mode === 'host' ? 'Hosting Game' : 'Joining Game'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 22,
  },
});
