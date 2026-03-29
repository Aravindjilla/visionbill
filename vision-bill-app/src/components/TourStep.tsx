import React, { useRef } from 'react';
import { View, ViewProps } from 'react-native';
import { useTour } from './AppTourProvider';

interface TourStepProps extends ViewProps {
  id: string;
  children: React.ReactNode;
}

export const TourStep: React.FC<TourStepProps> = ({ id, children, style, ...props }) => {
  const { registerTarget, isActive } = useTour();
  const viewRef = useRef<View>(null);

  const onLayout = () => {
    if (viewRef.current) {
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        registerTarget(id, { x: pageX, y: pageY, width, height });
      });
    }
  };

  return (
    <View 
      ref={viewRef} 
      onLayout={onLayout} 
      style={style} 
      {...props}
      collapsable={false} // Required for Android measure()
    >
      {children}
    </View>
  );
};
