import React from 'react';
import { Svg, Rect, Path } from 'react-native-svg';

const MailIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 100 100" fill="none">
    <Rect
      x="10"
      y="30"
      width="80"
      height="50"
      rx="5"
      stroke="#6C6C6C" // Borde más oscuro
      strokeWidth="2"
    />
    <Path
      d="M10 30 L50 60 L90 30"
      fill="none"
      stroke="#6C6C6C" // Línea de cierre del sobre
      strokeWidth="2"
    />
    <Path
      d="M10 80 L50 50 L90 80"
      fill="none"
      stroke="#6C6C6C" // Línea del fondo del sobre
      strokeWidth="2"
    />
  </Svg>
);

export default MailIcon;
