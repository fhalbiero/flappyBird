import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useFonts, Inter_900Black  } from '@expo-google-fonts/inter';
import { 
  useSharedValue, 
  withTiming, 
  Easing, 
  withSequence, 
  withRepeat, 
  useFrameCallback, 
  useDerivedValue, 
  interpolate, 
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
  cancelAnimation
} from "react-native-reanimated";
import { GestureHandlerRootView, GestureDetector, Gesture } from "react-native-gesture-handler";
import { Canvas, useImage, Image, Group, Text, matchFont } from "@shopify/react-native-skia";
 

const GRAVITY = 1000;
const JUMP_FORCE = -360;
const pipeWidth = 120;
const pipeHeight = 580;

const App = () => {
  const [fontsLoaded] = useFonts({
    Inter_900Black 
  });

  const { width, height } = useWindowDimensions();
  //Image Sources
  const bg = useImage(require('./assets/sprites/background-night.png'));
  const gameOverBg = useImage(require('./assets/sprites/gameover.png'));
  const ground = useImage(require('./assets/sprites/base.png'));
  const bird = useImage(require('./assets/sprites/yellowbird-upflap.png'));
  const pipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));

  //Consts
  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height + pipeOffset.value - 320);

  const gameOver = useSharedValue(false);
  const pipeX = useSharedValue(width);
  const bgX1 = useSharedValue(0);
  const bgX2 = useSharedValue(width - 20);
  const pipeSpeed = useSharedValue(1);
  const birdYPosition = useSharedValue(height / 3);
  const birdXPosition = width / 4;
  const birdYVelocity = useSharedValue(0);
  const birdTransform = useDerivedValue(() => {
    return [{ rotate: interpolate(
      birdYVelocity.value, 
      [-500, 500], 
      [-0.7, 0.7], 
      Extrapolation.CLAMP
    )}]
  });

  const obstacles = useDerivedValue(() => {
    return [
      //add bottom pipe
      {
        x: pipeX.value,
        y: bottomPipeY.value,
        h: pipeHeight,
        w: pipeWidth,
      },
      //add top pipe
      {
        x: pipeX.value,
        y: topPipeY.value,
        h: pipeHeight,
        w: pipeWidth,
      }
    ];
  });

  const birdOrigin = useDerivedValue(() => {
    return { 
      x: width / 4 + 32, 
      y: birdYPosition.value + 24
    }
  });

  //states
  const [score, setScore] = useState(0);

  useFrameCallback(({timeSincePreviousFrame: dt}) => {
    if (!dt || gameOver.value === true) return;
    birdYPosition.value = birdYPosition.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  })

  function moveMap() {
    pipeX.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000 / pipeSpeed.value, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ), -1
    );

    bgX1.value = withRepeat(
      withSequence(
        withTiming(-width, { duration: 10000, easing: Easing.linear }),
      ), -1
    );
    bgX2.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 10000, easing: Easing.linear }),
      ), -1
    );
  }

  useEffect(() => {
    moveMap();
  }, []);

  function restart() {
    'worklet';
    birdYPosition.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    pipeSpeed.value = 1;
    runOnJS(setScore)(0);
    runOnJS(moveMap)();
  }

  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      restart();
    } else {
      birdYVelocity.value = JUMP_FORCE;
    }
  });

  const fontFamily = Platform.select({ ios: 'Inter_900Black', default: 'Arial' });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    fontWeight: 'bold',
    textSha: ''
  }
  const font = matchFont(fontStyle);

  //SCORE system
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const position = birdXPosition - 100;
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;     
      }

      if (currentValue !== previousValue &&
          previousValue &&
          currentValue <= position &&
          previousValue > position) {
        runOnJS(setScore)(score + 1)
      }
    }
  );

  function isCollidingWithPipe(point, rect) {
    'worklet';
    return (point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.h + rect.y
    );
  }

  //COLISION system
  useAnimatedReaction(
    () => birdYPosition.value,
    (currentValue, previousValue) => {
      const birdCenter = {
        x: birdXPosition + 32,
        y: birdYPosition.value + 24
      }
      //Ground colision
      if (currentValue > height - 100 ||
          currentValue < 0
        ) {
        gameOver.value = true;
      }

      //Bottom Pipe colision
      const isColliding = obstacles.value.some(rect => 
        isCollidingWithPipe(birdCenter, rect)
      );
      
      if (isColliding) {
        gameOver.value = true;
      }  

    }
  )

  //COLISION system
  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
      }
    }
  )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height: '100%' }} >
            {/**Background */}
            <Image 
              x={bgX1}
              image={bg} 
              width={width} 
              height={height} 
              fit={'cover'} 
            />
            <Image 
              x={bgX2}
              image={bg} 
              width={width} 
              height={height} 
              fit={'cover'} 
            />
            
            {/**Pipes */}
            <Image 
              image={pipeTop} 
              y={topPipeY} 
              x={pipeX} 
              width={pipeWidth} 
              height={pipeHeight} 
            />
            <Image 
              image={pipeBottom} 
              y={bottomPipeY} 
              x={pipeX} 
              width={pipeWidth} 
              height={pipeHeight} 
            />
            
            {/**Ground */}
            <Image 
              image={ground} 
              width={width} 
              height={150} 
              y={height - 50}  
              fit={'cover'} 
            />
            
            {/**Bird */}
            <Group
              transform={birdTransform}
              origin={birdOrigin}
            >
              <Image 
                image={bird} 
                y={birdYPosition} 
                x={birdXPosition} 
                width={64} 
                height={48} 
              />
            </Group>
  
            <Text 
              x={width - 40} 
              y={80} 
              text={score.toString()} 
              font={font}
              color={'black'}
            />
            <Text 
              x={width - 41} 
              y={81} 
              text={score.toString()} 
              font={font}
              color={'white'}
            />
        </Canvas>         
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
 
export default App;