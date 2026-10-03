'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';

export type CanvasOffset = {
  x: number;
  y: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

type DragOrigin = {
  pointerX: number;
  pointerY: number;
  startOffsetX: number;
  startOffsetY: number;
};

interface UseDragCanvasOptions {
  initialOffset: CanvasOffset;
  clampOffset: (
    offset: CanvasOffset,
    viewportSize: ViewportSize
  ) => CanvasOffset;
}

export function useDragCanvas({
  initialOffset,
  clampOffset,
}: UseDragCanvasOptions) {
  const [canvasOffset, setCanvasOffset] = useState<CanvasOffset>(initialOffset);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);

  const canvasOffsetRef = useRef<CanvasOffset>(initialOffset);
  const dragOriginRef = useRef<DragOrigin | null>(null);

  useEffect(() => {
    const updateViewportSize = () => {
      const nextViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      setViewportSize(nextViewportSize);

      const nextOffset = clampOffset(canvasOffsetRef.current, nextViewportSize);
      canvasOffsetRef.current = nextOffset;
      setCanvasOffset(nextOffset);
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);

    return () => {
      window.removeEventListener('resize', updateViewportSize);
    };
  }, [clampOffset]);

  useEffect(() => {
    if (!isCanvasDragging) return;

    const updateCanvasPosition = (clientX: number, clientY: number) => {
      const dragOrigin = dragOriginRef.current;
      if (!dragOrigin) return;

      const nextOffset = clampOffset(
        {
          x: dragOrigin.startOffsetX + (clientX - dragOrigin.pointerX),
          y: dragOrigin.startOffsetY + (clientY - dragOrigin.pointerY),
        },
        viewportSize
      );

      canvasOffsetRef.current = nextOffset;
      setCanvasOffset(nextOffset);
    };

    const stopCanvasDrag = () => {
      dragOriginRef.current = null;
      setIsCanvasDragging(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      updateCanvasPosition(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      event.preventDefault();
      const touch = event.touches[0];
      updateCanvasPosition(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopCanvasDrag);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', stopCanvasDrag);
    document.addEventListener('touchcancel', stopCanvasDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopCanvasDrag);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopCanvasDrag);
      document.removeEventListener('touchcancel', stopCanvasDrag);
    };
  }, [isCanvasDragging, viewportSize, clampOffset]);

  const startCanvasDrag = useCallback((clientX: number, clientY: number) => {
    dragOriginRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      startOffsetX: canvasOffsetRef.current.x,
      startOffsetY: canvasOffsetRef.current.y,
    };
    setIsCanvasDragging(true);
  }, []);

  const handleCanvasMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      startCanvasDrag(event.clientX, event.clientY);
    },
    [startCanvasDrag]
  );

  const handleCanvasTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      startCanvasDrag(touch.clientX, touch.clientY);
    },
    [startCanvasDrag]
  );

  return {
    canvasOffset,
    viewportSize,
    isCanvasDragging,
    handleCanvasMouseDown,
    handleCanvasTouchStart,
  };
}
