import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { connectToServer, sendMessage, closeConnection } from '../network/socket';
import Board, { BoardHandle } from '../components/Board';

export default function GameScreen({ route, navigation }: any) {
  const { serverIp } = route.params;

  const ownBoardRef = useRef<BoardHandle | null>(null);
  const opponentBoardRef = useRef<BoardHandle | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const [ownReady, setOwnReady] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [bothConnected, setBothConnected] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [allShipsPlaced, setAllShipsPlaced] = useState<boolean>(false);
  const [placingInfo, setPlacingInfo] = useState<{ size: number | null; index: number | null; orientation: 'horizontal' | 'vertical' | null }>({ size: null, index: null, orientation: null });

    useEffect(() => {
      const onMessage = (msg: string) => {
        // WebSocket sends JSON strings, need to parse
        let data;
        try {
          data = JSON.parse(msg);
        } catch (e) {
          console.error('Failed to parse message:', msg);
          return;
        }
        
        console.log('📨 Received:', data);
        
        // handle incoming protocol
        if (data.type === 'attack') {
            // opponent is attacking our board
            if (ownBoardRef.current) {
              const hit = ownBoardRef.current.applyRemoteAttack(data.index);
              // send back result
              sendMessage({ type: 'attack_result', index: data.index, hit });
              // If opponent hit, they keep their turn (our turn stays false)
              // If opponent missed, it becomes our turn
              if (!hit) {
                setIsMyTurn(true);
              }
            }
          } else if (data.type === 'attack_result') {
            // opponent responded to our attack
            console.log('📨 Got attack_result:', data.index, 'hit:', data.hit);
            if (opponentBoardRef.current) {
              opponentBoardRef.current.applyAttackResult(data.index, data.hit);
            }
            // If we hit, we keep our turn
            // If we missed, opponent gets the turn
            const newTurn = !!data.hit;
            console.log('🎯 Setting our turn to:', newTurn);
            setIsMyTurn(newTurn);
          } else if (data.type === 'ready') {
            // opponent finished placement
            console.log('📨 Opponent is ready!');
            setOpponentReady(true);
            setBothConnected(true);
            console.log('✅ Set opponentReady to true');
          } else if (data.type === 'start_turn') {
            // Opponent decided turn order
            console.log('🎲 Received start_turn:', data.yourTurn);
            setIsMyTurn(data.yourTurn);
          } else if (data.type === 'game_over') {
            // Opponent's game is over, we won!
            setGameOver(true);
            Alert.alert(
              '🎉 Victory!', 
              'You destroyed all enemy ships!',
              [
                { text: 'Play Again', onPress: () => navigation.navigate('Home') },
                { text: 'Stay', style: 'cancel' }
              ]
            );
          } else if (data.type === 'ship_destroyed') {
            // We destroyed one of opponent's ships
            const shipNames: { [key: number]: string } = { 5: 'Carrier', 4: 'Battleship', 3: 'Cruiser/Submarine', 2: 'Destroyer' };
            const shipName = shipNames[data.size] || `Ship (${data.size})`;
            Alert.alert('🔥 SHIP DESTROYED! 🔥', `You sank the enemy ${shipName}!`, [{ text: 'Continue Battle!' }]);
          }
      };

      connectToServer(
        serverIp,
        onMessage,
        () => setConnected(true),
        () => setConnected(false)
      );

      return () => {
        closeConnection();
      };
    }, [serverIp]);

    // Debug logging for state changes
    useEffect(() => {
      console.log('🔄 State:', { ownReady, opponentReady, isMyTurn, connected });
    }, [ownReady, opponentReady, isMyTurn, connected]);

    function handleAction(action: any) {
      console.log('Outgoing action:', action);
      // this handler is used by opponentBoard for sending attacks
      if (action.type === 'attack') {
        if (!isMyTurn) {
          Alert.alert('Not your turn', 'Wait for opponent');
          return;
        }

        // send attack to opponent
        sendMessage({ type: 'attack', index: action.index });
        // after sending attack, wait for result — temporarily disable our turn
        setIsMyTurn(false);
      } else {
        // forward any other actions if needed
        sendMessage(action);
      }
    }

    // handle actions from our own board (placement / ready)
    function handleOwnAction(action: any) {
      if (action.type === 'ready') {
        console.log('✅ We are ready!');
        setOwnReady(true);
        sendMessage({ type: 'ready' });
        
        // if opponent is already ready, WE decide turns and tell them
        if (opponentReady) {
          console.log('🎲 Both ready! Deciding turns...');
          const weGoFirst = Math.random() < 0.5;
          setIsMyTurn(weGoFirst);
          console.log('👉 We go first:', weGoFirst);
          // Tell opponent their turn status
          sendMessage({ type: 'start_turn', yourTurn: !weGoFirst });
        }
      } else if (action.type === 'all_ships_placed') {
        setAllShipsPlaced(true);
      } else if (action.type === 'placing') {
        setPlacingInfo({ size: action.size ?? null, index: action.index ?? null, orientation: action.orientation ?? null });
        // Don't send placement info to opponent - it's local only
      } else if (action.type === 'ship_destroyed' || action.type === 'game_over') {
        // Forward ship destroyed and game over to opponent
        sendMessage(action);
      }
    }

    function handleReadyClick() {
      if (ownBoardRef.current && ownBoardRef.current.isReadyToStart()) {
        ownBoardRef.current.markReady();
      } else {
        Alert.alert('Not Ready', 'Please place all 5 ships before marking ready');
      }
    }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: connected ? '#0f0' : '#f00', marginRight: 8 }} />
          <Text style={{ fontSize: 14, color: '#000' }}>
            {!connected ? 'Connecting to server...' : bothConnected ? 'Both players connected!' : 'Waiting for 2nd player...'}
          </Text>
        </View>
      
      <Text style={styles.text}>Place ships by tapping cells</Text>

      <Text style={{ fontSize: 18, marginTop: 8, fontWeight: 'bold', color: isMyTurn ? '#2e7d32' : '#666' }}>
        {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ marginRight: 12, color: '#000', fontWeight: '600' }}>Orientation:</Text>
        <Text style={{ marginRight: 12, color: '#000', fontWeight: 'bold' }}>{placingInfo.orientation ?? '-'}</Text>
        <Text style={{ color: '#000', fontWeight: '600' }}>Ship size: </Text>
        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>{placingInfo.size ?? '-'}</Text>
      </View>

      <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#000' }}>Your Board</Text>
      <Board ref={ownBoardRef} onAction={handleOwnAction} />

      {/* Ready Button */}
      {allShipsPlaced && !ownReady && (
        <TouchableOpacity 
          style={styles.readyButton}
          onPress={handleReadyClick}
        >
          <Text style={styles.readyButtonText}>I'm Ready!</Text>
        </TouchableOpacity>
      )}

      {ownReady && !opponentReady && (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>Waiting for opponent to be ready...</Text>
        </View>
      )}

      {/* Only show opponent board after both players are ready */}
      {ownReady && opponentReady && (
        <>
          <Text style={{ marginTop: 16, fontWeight: 'bold', color: '#000' }}>Opponent Board</Text>
          <View style={{ width: 320, height: 320, position: 'relative' }}>
            <Board ref={opponentBoardRef} isOpponentBoard disabled={!isMyTurn} onAction={handleAction} />
            {!isMyTurn && (
              <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18 }}>Waiting for opponent...</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <Text style={{ marginRight: 12, color: '#000', fontWeight: '600' }}>You: Ready</Text>
            <Text style={{ color: '#000', fontWeight: '600' }}>Opponent: Ready</Text>
          </View>
        </>
      )}

      {gameOver && (
        <TouchableOpacity 
          style={[styles.readyButton, { backgroundColor: '#2196F3', marginTop: 20 }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.readyButtonText}>Return to Home</Text>
        </TouchableOpacity>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
  readyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  waitingText: {
    color: '#856404',
    fontSize: 16,
  },
});
