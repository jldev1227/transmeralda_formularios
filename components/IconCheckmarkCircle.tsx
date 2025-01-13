// icon:checkmark-circle | Ionicons https://ionicons.com/ | Ionic Framework
import * as React from "react";
import Svg, { Path } from "react-native-svg";

function IconCheckmarkCircle(props: any) {
  return (
    <Svg
      viewBox="0 0 512 512"
      fill={'#2E8B57'}
      height="24"
      width="24"
      {...props}
    >
      <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z" />
    </Svg>
  );
}

export default IconCheckmarkCircle;
