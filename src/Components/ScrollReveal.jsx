import React, { useEffect, useRef, useState } from "react";

const ScrollReveal = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once triggered, stop observing to keep performance high
            observer.unobserve(domRef.current);
          }
        });
      },
      { threshold: 0.1 },
    ); // Trigger when 10% of component is visible

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={domRef} className={`reveal ${isVisible ? "active" : ""}`}>
      {children}
    </div>
  );
};

export default ScrollReveal;
