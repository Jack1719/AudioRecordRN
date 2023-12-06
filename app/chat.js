import * as React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MessageBox from '../components/MessageBox';
import { FlashList } from "@shopify/flash-list";
import { Button } from 'react-native';
import { router } from 'expo-router';

const DATA = [
  {
    title: "First Item",
  },
  {
    title: "Second Item",
  },
];

export default function App() {
  return (
    <View style={styles.container}>
      <Button onPress={() => router.back()} title="back"/>
      <View style={styles.messageList}>
        <FlashList
          data={DATA}
          renderItem={({ item }) => <Text>{item.title}</Text>}
          estimatedItemSize={200}
        />
      </View>
      <MessageBox style={styles.messageBox} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
    padding: 10,
    display: 'flex'
  },
  messageList: {
    flex: 1
  },
  messageBox: {
    width: '100%'
  }
});
