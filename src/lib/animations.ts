
import { useEffect, useState, useRef, RefObject } from 'react';

export function useInView() {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(ref.current as HTMLElement);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );
    
    observer.observe(ref.current);
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isInView };
}

export function useAnimatedRef<T extends HTMLElement>() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(currentRef);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return [ref, isVisible] as [RefObject<T>, boolean];
}

export function useSequentialAnimation(count: number, delay: number = 200) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(Array(count).fill(false));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start the sequence of animations once the container is in view
          let newVisibleItems = [...visibleItems];
          
          const animateItems = (index: number) => {
            if (index >= count) return;
            
            newVisibleItems[index] = true;
            setVisibleItems([...newVisibleItems]);
            
            setTimeout(() => {
              animateItems(index + 1);
            }, delay);
          };
          
          animateItems(0);
          observer.unobserve(container);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    
    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, [count, delay, visibleItems]);

  return { containerRef, visibleItems };
}
