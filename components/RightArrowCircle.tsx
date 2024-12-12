import React from 'react';
import { Svg, Circle, Path } from 'react-native-svg';

const RightArrowCircle = () => (
  <Svg width="24" height="24" viewBox="0 0 100 100" fill="none">
    <Circle cx="50" cy="50" r="50" fill="#2E8B57" />
    
    <Path
      d="M40 30 L60 50 L40 70" // Define la forma de la flecha
      stroke="#FFFFFF"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

  </Svg>
);

export default RightArrowCircle;
