import React, { useState, useRef, useEffect } from "react";
import category from "../../Files/PortImages";
import "../../Style/ProjectPage.css";

function ProjectPage({ cat }) {
  const name = cat;

  const found = category.find((item) => {
    if (!item || !item.title || !cat) return false;
    return item.title.toLowerCase() === String(cat).toLowerCase();
  });

  const descript = found ? found.description : "";

  const cover = found ? found.image[0] : "";

  // lightbox state (use index so we can navigate)
  const [currentIndex, setCurrentIndex] = useState(null);
  const closeButtonRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const openLightbox = (index) => {
    // store last focused element to restore focus on close
    lastFocusedRef.current = document.activeElement;
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setCurrentIndex(null);
    // restore focus back to the previously focused element if possible
    try {
      if (lastFocusedRef.current && lastFocusedRef.current.focus) {
        lastFocusedRef.current.focus();
      }
    } catch (e) {
      // ignore
    }
  };

  const lightboxSrc =
    found && currentIndex !== null ? found.image[currentIndex] : "";

  const prevImage = () => {
    if (!found) return;
    setCurrentIndex((idx) => (idx === 0 ? found.image.length - 1 : idx - 1));
  };

  const nextImage = () => {
    if (!found) return;
    setCurrentIndex((idx) => (idx === found.image.length - 1 ? 0 : idx + 1));
  };

  // keyboard navigation and focus management when lightbox open
  useEffect(() => {
    if (currentIndex === null) return;

    // focus close button for accessibility
    if (closeButtonRef.current && closeButtonRef.current.focus) {
      closeButtonRef.current.focus();
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, found]);

  return (
    <div className="page-container">
      <div className="name-descript">
        <h1>{name}</h1>
        <p>{descript}</p>
      </div>
      <img src={cover} alt={`${name} cover`} />
      <div className="page-images">
        {found.image.map((item, i) => (
          <div key={i} className="page-image-item">
            <img
              src={item}
              alt={`${name} ${i + 1}`}
              onClick={() => openLightbox(i)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openLightbox(i);
              }}
            />
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      {currentIndex !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
        >
          <button
            ref={closeButtonRef}
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-prev"
              onClick={prevImage}
              aria-label="Previous"
            >
              <i className="fa-solid fa-angle-left"></i>
            </button>

            <img
              src={lightboxSrc}
              alt={`Enlarged ${name} ${currentIndex + 1}`}
            />

            <button
              className="lightbox-next"
              onClick={nextImage}
              aria-label="Next"
            >
              <i className="fa-solid fa-angle-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectPage;
