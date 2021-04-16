import React, { useCallback, useRef } from "react";
import { useStaticValues } from "./DraggableFlatListContext";
import { RowItemProps } from "./types";

function RowItem<T>(props: RowItemProps<T>) {
  const propsRef = useRef(props);
  propsRef.current = props;

  const { keyToIndexRef } = useStaticValues();

  const drag = useCallback(() => {
    const { drag, renderItem, item, itemKey, debug } = propsRef.current;
    const hoverComponent = renderItem({
      isActive: true,
      item,
      index: keyToIndexRef.current.get(itemKey),
      drag: () => {
        if (debug) {
          console.log("## attempt to call drag() on hovering component");
        }
      },
    });
    drag(hoverComponent, itemKey);
  }, [keyToIndexRef]);

  const { renderItem, item, itemKey } = props;
  return renderItem({
    isActive: false,
    item,
    drag,
    index: keyToIndexRef.current.get(itemKey),
  }) as JSX.Element;
}

export default React.memo(RowItem);
