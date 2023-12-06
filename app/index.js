import { View } from 'react-native';

import { Link } from 'expo-router';


export default function Page() {
  return (
    <View>
      <Link href="/chat" style={{backgroundColor: 'blue', height: 50, width: 100}}>Chat</Link>
    </View>
  );
}
