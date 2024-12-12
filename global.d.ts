declare module '@benjeau/react-native-draw' {
    import React from 'react';
    const Draw: React.FC<{
      color?: string;
      strokeWidth?: number;
      style?: object;
    }>;
    export default Draw;
  }
  