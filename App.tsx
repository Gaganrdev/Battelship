import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from 'react-native-screens';

import HomeScreen from './src/screens/HomeScreen'
import GameScreen from './src/screens/GameScreen'

enableScreens(false);

const stack = createNativeStackNavigator();
export default function App(){
  return(
    <NavigationContainer>
      <stack.Navigator>
        <stack.Screen name="Home" component={HomeScreen}/>
        <stack.Screen name="Game" component={GameScreen}/>
      </stack.Navigator>
    </NavigationContainer>
  );
}
