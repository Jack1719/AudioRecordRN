import 'react-native-gesture-handler';
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withDelay, cancelAnimation } from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const AnimatedBar = React.forwardRef((_, ref) => {
  const animatedValue = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: animatedValue.value,
      width: 3,
      backgroundColor: "white",
      borderRadius: 1.5,
      marginLeft: 2,
    };
  });
  React.useEffect(() => {
    ref.current.push(animatedValue);
  }, []);

  return (
    <Animated.View style={animatedStyle}/>
  );
});
const MAX_BARS = 100; // Maximum number of bars in the graph
// 1 px for 50 millisec, 1 bar for 250 millisec, 1 bar for 5 px
export default function MessageBox({style}) {
  const [animatedViewArray,_] = React.useState(Array(MAX_BARS).fill(0));
  const animatedDataRef = React.useRef([]);
  const [recording, setRecording] = React.useState();
  const recordInitAnimationScale = useSharedValue(0);
  const recordButtonPressed = useSharedValue(false);
  const recordPanX = useSharedValue(0);
  const trashAnimatedStyle = useAnimatedStyle(() => ({transform: [{ scale: recordInitAnimationScale.value }]}));
  const [containerWidth, setContainerWidth] = React.useState(0);
  const recordContainerAnimatedStyle = useAnimatedStyle(() => ({height: 40 + recordInitAnimationScale.value * 10, left: 5 - recordInitAnimationScale.value * 5, width : 40 + (containerWidth - 40) * recordInitAnimationScale.value}), [containerWidth])
  const tempRef = React.useRef(null);
  const realtimeRecordContainerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 48,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  }))
  const recordLockContainerStyle = useAnimatedStyle(() => ({
    top: -(recordInitAnimationScale.value * 130),
    display: recordInitAnimationScale.value ? 'flex' : "none",
    left: recordPanX.value - 30,
  }))
  const recordLockAnimatedStyle = useAnimatedStyle(() => ({
    borderRadius: '50%',
    width: 40,
    height: 40,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'dimgray',
    transform: [{
      scale: withRepeat(
      withSequence(
        withTiming(0.9, {duration: 0}),
        withTiming(1.1, {duration: 1000}),
        withTiming(0.9, {duration: 1000}),
      ),
      -1
    )}]
  }));
  const swipeTextAnimatedStyle = useAnimatedStyle(() => ({
    top: - (recordInitAnimationScale.value * 80),
    opacity: recordInitAnimationScale.value ? 1 : 0
  }))
  const containerLayoutCallback = React.useCallback((e) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);
  const onRecordingStatusUpdate = React.useCallback((status) => { 
    // console.log(status.metering)
  },[]);
  const currentAudioDataIndex = useSharedValue(0);
  const startRecordingCallback = React.useCallback(async (event) => {
    recordInitAnimationScale.value = withTiming(1, {duration: 300});
    recordPanX.value = event.absoluteX;
    recordButtonPressed.value = true;
    const timeoutHandler = setTimeout(() => {
      'worklet';
      clearTimeout(timeoutHandler);
      currentAudioDataIndex.value = withTiming(500, {duration: 25000});
      tempRef.current = setInterval(() => {
        'worklet';
        animatedDataRef.current[Math.floor(currentAudioDataIndex.value / 4)].value = withTiming(Math.floor(Math.random() * 45) + 3, {duration: 150});
      }, 250)
    }, 300)
    // setTimeout(async () => {
    //   try {
    //     console.log('Requesting permissions..');
    //     await Audio.requestPermissionsAsync();
    //     await Audio.setAudioModeAsync({
    //       allowsRecordingIOS: true,
    //       playsInSilentModeIOS: true,
    //     });
  
    //     console.log('Starting recording..');
    //     const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY,
    //       onRecordingStatusUpdate
    //     );
    //     setRecording(recording);
    //     console.log('Recording started');
    //   } catch (err) {
    //     console.error('Failed to start recording', err);
    //     cancelAnimation(recordInitAnimationScale);
    //     cancelAnimation(recordButtonPressed);
    //     recordInitAnimationScale.value = 0;
    //     recordButtonPressed.value = false;
    //   }  
    // }, 300)
  }, [onRecordingStatusUpdate]);
  const stopRecordingCallback = React.useCallback(async () => {
    console.log("stopped pan");
    clearInterval(tempRef.current);
    currentAudioDataIndex.value = 0;
    // if (recording) {
    //   console.log('Stopping recording..');
    //   setRecording(undefined);
    //   await recording.stopAndUnloadAsync();
    //   await Audio.setAudioModeAsync(
    //     {
    //       allowsRecordingIOS: false,
    //     }
    //   );
    //   const uri = recording.getURI();
    //   console.log('Recording stopped and stored at', uri);
    // }
    cancelAnimation(recordInitAnimationScale);
    cancelAnimation(recordButtonPressed);
    recordInitAnimationScale.value = 0;
    recordButtonPressed.value = false;
  }, []);
  const onRecordingPanChange = React.useCallback((event) => {
    'worklet';
    recordPanX.value = event.absoluteX;
  }, []);
  const recordPan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(startRecordingCallback)
    .onChange(onRecordingPanChange)
    .onFinalize(stopRecordingCallback);

  return (
    <GestureHandlerRootView  style={[styles.container, style]} onLayout={containerLayoutCallback}>
      <GestureDetector gesture={recordPan}>
        <View style={styles.recordButton}>
          <FontAwesome name="microphone" size={24} color="black" />
        </View>
      </GestureDetector>
      <Animated.View style={[styles.recordContainer, recordContainerAnimatedStyle]}>
        <FontAwesome name="camera" size={20} color="white" style={{opacity : recording ? 0 : 1}} />
        <Animated.View style={[styles.trashIcon, trashAnimatedStyle]}>
          <FontAwesome name="trash" size={20} color="gray" />
        </Animated.View>
      </Animated.View>
      <View style={styles.swipeTextContainer}>
        <Animated.View style={swipeTextAnimatedStyle}>
          <Text style={styles.swipeText}>Swipe left to cancel or release to send</Text>
        </Animated.View>
      </View>
      <Animated.View style={recordLockContainerStyle}>
        <Animated.View style={recordLockAnimatedStyle}>
          <FontAwesome name="unlock-alt" size={20} color="grey" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={realtimeRecordContainerStyle}>
      {
        animatedViewArray.map((_, i) => (
          <AnimatedBar ref={animatedDataRef} key={i}/>
        ))
      }
      </Animated.View>
    </GestureHandlerRootView >
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'grey',
    height: 50,
    padding: 5,
    borderRadius: '100%',
    width: '100%',
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible'
  },
  recordContainer: {
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '100%',
    position: 'absolute',
    flexDirection: 'row',
    overflow: 'visible'
  },
  recordButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 5
  },
  trashIcon: {
    position: 'absolute',
    left: 5,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: '50%'
  },
  swipeText: {
    color: 'gray'
  },
  swipeTextContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center'
  }
});
