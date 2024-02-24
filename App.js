import { useWindowDimensions } from "react-native";
import { Canvas, useImage, Image } from "@shopify/react-native-skia";
 
const App = () => {
  const { width, height } = useWindowDimensions();
  const bg = useImage(require('./assets/sprites/background-day.png'));
  const ground = useImage(require('./assets/sprites/base.png'));
  const bird = useImage(require('./assets/sprites/yellowbird-upflap.png'));
  const pipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));

  const pipeOffset = 0;

  return (
    <Canvas style={{ width, height }}>
      {/**Background */}
      <Image image={bg} width={width} height={height} fit={'cover'} />
      {/**Pipes */}
      <Image image={pipeTop} y={pipeOffset - 320} x={width / 2} width={140} height={640} />
      <Image image={pipeBottom} y={height + pipeOffset - 320} x={width / 2} width={140} height={640} />
      {/**Ground */}
      <Image image={ground} width={width} height={100} y={height - 75}  fit={'cover'} />
      {/**Bird */}
      <Image image={bird} y={height/2 - 24} x={width / 4} width={64} height={48} />

    </Canvas>
  );
};
 
export default App;