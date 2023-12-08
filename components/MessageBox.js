import 'react-native-gesture-handler';
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, cancelAnimation, Easing, useDerivedValue, useAnimatedReaction, runOnUI, runOnJS } from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const AnimatedBar = React.forwardRef((_, ref) => {
  const animatedValue = useSharedValue(10);
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
    console.log(ref.current.length)
    ref.current.push(animatedValue);
  }, []);

  return (
    <Animated.View style={animatedStyle}/>
  );
});
const MILLISECOND_PER_BAR = 250;
const PIXEL_PER_BAR = 5;
const MAX_RECORD_MILLISECOND = 60000;
const MAX_TOTAL_RECORD_WIDTH = MAX_RECORD_MILLISECOND / 250 * 5; // 1 min

const RecordingBarsAnimationController = ({barsArrayRef, paddingLeft}) => {
  useAnimatedReaction(() => paddingLeft.value, (curr, prev) => {
    if (curr !== prev) {
      const temp = barsArrayRef.current[0].value;
      for (let i = 0; i < barsArrayRef.current.length - 1; i++) {
        barsArrayRef.current[i].value = barsArrayRef.current[i+1].value;
      }
      barsArrayRef.current[barsArrayRef.current.length - 1].value = temp;
    }
  });

  return <View />
};
export default function MessageBox({style}) {
  const [maxBars, setMaxBars] = React.useState(0);
  const recordingBarAnimatedArray = React.useRef([]);
  const [recording, setRecording] = React.useState();
  const recordInitAnimationScale = useSharedValue(0);
  const recordingWindowWidth = useSharedValue(0);
  const recordingTotalWidth = useSharedValue(0);
  const recordButtonPressed = useSharedValue(false);
  const recordPanX = useSharedValue(0);
  const trashAnimatedStyle = useAnimatedStyle(() => ({transform: [{ scale: recordInitAnimationScale.value }]}));
  const [containerWidth, setContainerWidth] = React.useState(0);
  const recordContainerAnimatedStyle = useAnimatedStyle(() => ({height: 40 + recordInitAnimationScale.value * 10, left: 5 - recordInitAnimationScale.value * 5, width : 40 + (containerWidth - 40) * recordInitAnimationScale.value}), [containerWidth])
  const tempRef = React.useRef(null);
  const cameraButtonStyle = useAnimatedStyle(() => ({opacity: recordButtonPressed.value ? 0 : 1}));
  const recordingBarsContainerPaddingLeft = useSharedValue(0);
  const recordingBarsContainerStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    width: recordingTotalWidth.value,
    paddingLeft: recordingBarsContainerPaddingLeft.value,
    overflow: 'hidden',
  }));
  const recordingBarsWindowStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 48,
    top: 0,
    height: 50,
    width: recordingWindowWidth.value,
    flexDirection: 'row-reverse',
    overflow: 'hidden'
  }));
  useDerivedValue(() => {
    'worklet';
    if (recordingWindowWidth.value < recordingTotalWidth.value) {
      const delta = recordingTotalWidth.value - recordingWindowWidth.value;
      if (delta > PIXEL_PER_BAR) {
        const expectedPadding = Math.floor(delta / PIXEL_PER_BAR) * PIXEL_PER_BAR;
        if (expectedPadding != recordingBarsContainerPaddingLeft.value) {
          recordingBarsContainerPaddingLeft.value = expectedPadding;
        }
      }
    }
  }, [])
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
    const maxBars = Math.floor((e.nativeEvent.layout.width - 55) / (PIXEL_PER_BAR * 4));
    setMaxBars(maxBars);
  }, []);
  const onRecordingStatusUpdate = React.useCallback((status) => { 
    // console.log(status.metering)
  },[]);
  const startRecordingCallback = React.useCallback(async (event) => {
    recordInitAnimationScale.value = withTiming(1, {duration: 300});
    setTimeout(() => {
      recordingWindowWidth.value = withTiming(maxBars * PIXEL_PER_BAR, {duration: maxBars * MILLISECOND_PER_BAR, easing: Easing.linear});
      recordingTotalWidth.value = withTiming(MAX_TOTAL_RECORD_WIDTH, {duration: MAX_RECORD_MILLISECOND, easing: Easing.linear});
      tempRef.current = setInterval(() => {
        'worklet';
        let currentIndex = Math.floor(recordingTotalWidth.value / PIXEL_PER_BAR);
        if (currentIndex > (maxBars + 1)) currentIndex = maxBars + 1;
        recordingBarAnimatedArray.current[currentIndex].value = withTiming(Math.floor(Math.random() * 45) + 3, {duration: 150});
      }, 250);
    }, 300)
    recordPanX.value = event.absoluteX;
    recordButtonPressed.value = true;
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
  }, [onRecordingStatusUpdate, maxBars]);
  const stopRecordingCallback = React.useCallback(async () => {
    clearInterval(tempRef.current);
    tempRef.current = null;
    recordingWindowWidth.value = 0;
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
    cancelAnimation(recordingWindowWidth);
    recordInitAnimationScale.value = 0;
    recordButtonPressed.value = false;
    recordingWindowWidth.value = 0;
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
        <Animated.View style={cameraButtonStyle}>
          <FontAwesome name="camera" size={20} color="white" style={{opacity : recording ? 0 : 1}} />
        </Animated.View>
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
      <Animated.View style={recordingBarsWindowStyle}>
        <Animated.View style={recordingBarsContainerStyle}>
          {
            [...Array(maxBars + 2)].map((_, i) => (
              <AnimatedBar ref={recordingBarAnimatedArray} key={i}/>
            ))
          }
        </Animated.View>
      </Animated.View>
      {
        maxBars !== 0 && <RecordingBarsAnimationController barsArrayRef={recordingBarAnimatedArray} paddingLeft={recordingBarsContainerPaddingLeft} /> 
      }
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
