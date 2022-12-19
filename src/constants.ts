import { Platform, Dimensions } from "react-native";
import { PanGestureHandlerProperties } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  WithSpringConfig,
} from "react-native-reanimated";

const {height, width} = Dimensions.get("screen");

// Fire onScrollComplete when within this many px of target offset
export const SCROLL_POSITION_TOLERANCE = 2;
export const DEFAULT_ANIMATION_CONFIG: WithSpringConfig = {
  damping: 20,
  mass: 0.2,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 0.2,
  restDisplacementThreshold: 0.2,
};

export const DEFAULT_PROPS = {
  autoscrollThreshold: 0,//30,
  autoscrollSpeed: 0,//100,
  animationConfig: DEFAULT_ANIMATION_CONFIG,
  scrollEnabled: true,
  dragHitSlop: 0 as PanGestureHandlerProperties["hitSlop"],
  activationDistance: 0,
  dragItemOverflow: false,
  debug: false,
  localization: {},
  screenHeight: height,
  scrollEventThrottle: 1
};

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";

// Is there a better way to check for v2?
export const isReanimatedV2 = !!useSharedValue;

if (!isReanimatedV2) {
  throw new Error(
    "Your version of react-native-reanimated is too old for react-native-draggable-flatlist!"
  );
}
