import React, { useRef, useState, useEffect } from "react";
import "../../Style/Slider.css";

function Slider({ items, setActivePage }) {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0); // hide left button if at start
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth); // hide right button if at end
    }
  };

  const handleScrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollLeft -= 500;
      checkScroll();
    }
  };

  const handleScrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollLeft += 500;
      checkScroll();
    }
  };

  // Attach scroll listener
  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener("scroll", checkScroll);
      checkScroll(); // run once at start
    }
    return () => {
      if (slider) {
        slider.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  return (
    <div className="slider-box">
      <div className="slider-container">
        {canScrollLeft && (
          <button className="slider-btn left" onClick={handleScrollLeft}>
            <i className="fa-solid fa-angle-left"></i>
          </button>
        )}

        <div className="slider" ref={sliderRef}>
          {items.map((item, i) => (
            <div className="slider-item" key={i}>
              <img src={item.image} alt={item.title} />
              <h3>{item.title}</h3>
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button className="slider-btn right" onClick={handleScrollRight}>
            <i className="fa-solid fa-angle-right"></i>
          </button>
        )}
      </div>

      <button
        className="btn"
        onClick={() =>
          setActivePage &&
          (setActivePage("PortfolioPage"),
          window.scrollTo({ top: 0, behavior: "smooth" }))
        }
      >
        View More
      </button>
    </div>
  );
}

export default Slider;
