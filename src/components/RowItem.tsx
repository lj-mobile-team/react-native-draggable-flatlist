//@ts-ignore
import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Easing as RNEasing,
  Alert,
  View,
  Text,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  PanGesture,
} from "react-native-gesture-handler";
import { useDraggableFlatListContext } from "../context/draggableFlatListContext";
import { useRefs } from "../context/refContext";
import { useStableCallback } from "../hooks/useStableCallback";
import { RenderItem } from "../types";
import { typedMemo } from "../utils";

import Animated, { runOnJS, SharedValue } from "react-native-reanimated";
import {
  PanGestureHandler,
  State as GestureState,
} from "react-native-gesture-handler";
const { block, onChange, call } = Animated;

type Props<T> = {
  extraData?: any;
  drag: (itemKey: string) => void;
  item: T;
  renderItem: RenderItem<T>;
  itemKey: string;
  debug?: boolean;
  horizontal?: any;
  itemProp: any;
  deleteItem?: (key: string) => void;
  localization?: any;
  screenHeight?: number;
  panGesture: PanGesture;
  activeIndex: number;
};

function RowItem<T>(props: Props<T>) {
  const propsRef = useRef(props);
  propsRef.current = props;

  let _height = 0;
  let _dragY = new RNAnimated.Value(0);
  const [enabled, setEnabled] = useState(true);

  const { activeKey } = useDraggableFlatListContext();
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const { keyToIndexRef } = useRefs();

  useEffect(() => {
    toggleEnabled([props.activeIndex]);
  }, [props.activeIndex]);

  const drag = useStableCallback(() => {
    const { drag, itemKey, debug } = propsRef.current;
    if (activeKeyRef.current) {
      // already dragging an item, noop
      if (debug)
        console.log(
          "## attempt to drag item while another item is already active, noop"
        );
    }
    drag(itemKey);
  });

  const _onLayout = (props: any) => {
    const { nativeEvent } = props;
    _height = nativeEvent?.layout?.height;
  };

  const { renderItem, item, itemKey, extraData } = props;

  const getIndex = useStableCallback(() => {
    return keyToIndexRef.current.get(itemKey);
  });

  const _toogleSnapAnimate = useStableCallback(
    ({ isDelete }: { isDelete: Boolean }) => {
      const { deleteItem, itemProp, localization, screenHeight } = props;

      const isMediaCard =
        itemProp.cardType === "video" || itemProp.cardType === "photo";

      const isUploading =
        isMediaCard &&
        itemProp?.blocks[0]?.data?.localUri &&
        ((itemProp.cardType === "photo" && !itemProp?.blocks[0]?.data?.src) ||
          (itemProp.cardType === "video" &&
            !itemProp?.blocks[0]?.data?.link)) &&
        !itemProp?.blocks[0]?.data?.error;

      RNAnimated.timing(_dragY, {
        duration: !isUploading && isDelete ? 100 : 300,
        toValue:
          !isUploading && isDelete ? (-(screenHeight ?? 0) - _height) / 2 : 0,
        easing: RNEasing.linear,
        useNativeDriver: true,
      }).start(() => {
        if (isUploading) {
          Alert.alert(
            localization["delete_imposible"],
            localization["media_not_load_yet"]
          );
        } else if (isDelete) {
          deleteItem?.(itemProp.key);
        }
      });
    }
  );

  const toggleEnabled = (args: readonly number[]) => {
    if (args[0] > -1) {
      setEnabled(false);
    } else {
      setEnabled(true);
    }
  };

  const component = renderItem({
    isActive: false,
    item,
    getIndex,
    drag,
  });

  let wrapperStyle: { opacity: number; width?: number; height?: number } = {
    opacity: 1,
  };

  const gestureEvent = RNAnimated.event(
    [
      {
        nativeEvent: {
          translationX: new RNAnimated.Value(0),
          translationY: getIndex() ? _dragY : new RNAnimated.Value(0),
        },
      },
    ],
    {
      // listener: this._onGestureEvent,
      useNativeDriver: true,
    }
  );

  const _moveY = useStableCallback(({ dragY }: { dragY: number }) => {
    if (getIndex()) {
      RNAnimated.timing(_dragY, {
        duration: 1,
        toValue: dragY,
        easing: RNEasing.linear,
        useNativeDriver: true,
      }).start(() => {});
    }
  });

  const itemPanGesture = Gesture.Pan()
    .enabled(!!getIndex() && enabled)
    .activeOffsetY([-10, 10])
    .simultaneousWithExternalGesture(props.panGesture)
    .onEnd((event) => {
      runOnJS(_toogleSnapAnimate)({
        isDelete: event.translationY <= -200,
      });
    })
    .onUpdate((event) => {
      runOnJS(_moveY)({ dragY: event.translationY });
    });

  return (
    <View
      onLayout={_onLayout}
      collapsable={false}
      style={{
        flex: 1,
        opacity: 1,
        flexDirection: props.horizontal ? "row" : "column",
      }}
    >
      <GestureDetector gesture={itemPanGesture}>
        <RNAnimated.View
          style={[
            wrapperStyle,
            {
              flex: 1,
              transform: [
                {
                  translateX: 0,
                },
                {
                  translateY: _dragY,
                },
              ],
            },
          ]}
        >
          <MemoizedInner
            isActive={activeKey === itemKey}
            drag={drag}
            renderItem={renderItem}
            item={item}
            getIndex={getIndex}
            extraData={extraData}
          />
        </RNAnimated.View>
      </GestureDetector>
      {/* <Animated.Code>
        {() =>
          block([
            onChange(props.activeIndex, call([props.activeIndex], toggleEnabled))
          ])
        }
      </Animated.Code> */}
    </View>
  );
}

export default RowItem;

type InnerProps<T> = {
  isActive: boolean;
  item: T;
  getIndex: () => number | undefined;
  drag: () => void;
  renderItem: RenderItem<T>;
  extraData?: any;
};

function Inner<T>({ renderItem, extraData, ...rest }: InnerProps<T>) {
  return renderItem({ ...rest }) as JSX.Element;
}

const MemoizedInner = typedMemo(Inner);
