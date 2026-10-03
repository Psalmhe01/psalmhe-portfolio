import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconX,
} from "@tabler/icons-react";
import "../../Style/ProjectPage.css";

const photoNumber = (index) => String(index + 1).padStart(2, "0");

function LightboxPhoto({ src, alt }) {
  const [status, setStatus] = useState("loading");

  return (
    <>
      {status === "loading" && (
        <span className="project-lightbox__status" role="status">Loading photograph…</span>
      )}
      {status === "error" && (
        <div className="project-lightbox__status" role="status">
          <p>This photograph couldn’t be loaded.</p>
          <a href={src} target="_blank" rel="noreferrer">Open original photograph</a>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="project-lightbox__image"
        data-ready={status === "loaded"}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        draggable={false}
      />
    </>
  );
}

export default function ProjectLightbox({
  images, index, project, onClose, onSelect,
  photoItems, onDownload, downloadBusy = false, photoActions, className = "",
  selectedPhotoIds, eyebrow = "Psalmhe / Selected works", detailsLabel = "The collection",
}) {
  const thumbnailStripRef = useRef(null);
  const pointerStartRef = useRef(null);
  const opened = index !== null && Boolean(images[index]);
  const src = opened ? images[index] : "";
  const currentPhoto = opened ? photoItems?.[index] : null;

  const move = (direction) => {
    if (images.length > 1) onSelect((index + direction + images.length) % images.length);
  };

  const centerActiveThumbnail = useCallback(() => {
    const strip = thumbnailStripRef.current;
    const active = strip?.querySelector('[aria-current="true"]');
    if (active) {
      // Scroll only the filmstrip, never the page behind the dialog.
      strip.scrollLeft = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
    }
  }, []);

  useEffect(() => {
    if (!opened) return;
    centerActiveThumbnail();
    if (images.length > 1) {
      [1, -1].forEach((direction) => {
        const preload = new window.Image();
        preload.src = images[(index + direction + images.length) % images.length];
      });
    }
  }, [index, opened, images, centerActiveThumbnail]);

  const handleKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      onSelect(event.key === "Home" ? 0 : images.length - 1);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      onEnterTransitionEnd={centerActiveThumbnail}
      withCloseButton={false}
      title={`${project.title} photo viewer`}
      zIndex={2000}
      transitionProps={{ transition: "fade", duration: 180 }}
      classNames={{ content: "project-lightbox__modal", body: "project-lightbox__body" }}
      styles={{ header: { position: "absolute", width: 1, height: 1, padding: 0, overflow: "hidden", clipPath: "inset(50%)" } }}
    >
      {opened && (
        <div className={`project-lightbox ${className}`} onKeyDown={handleKeyDown}>
          <header className="project-lightbox__topbar">
            <div className="project-lightbox__identity">
              <span className="project-lightbox__eyebrow">{eyebrow}</span>
              <span className="project-lightbox__collection">{project.title}</span>
            </div>
            <div className="project-lightbox__actions">
              <span className="project-lightbox__counter" aria-live="polite" aria-atomic="true">
                <span className="project-lightbox__sr-only">Photograph </span>
                {photoNumber(index)} <span>/ {String(images.length).padStart(2, "0")}</span>
              </span>
              <button type="button" className="project-lightbox__control" onClick={onClose} aria-label="Close photo viewer" data-autofocus>
                <IconX size={20} />
              </button>
            </div>
          </header>

          <div className="project-lightbox__layout">
            <div className="project-lightbox__stage"
              onPointerDown={(event) => {
                if (event.pointerType === "mouse" || !event.isPrimary) return;
                pointerStartRef.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerUp={(event) => {
                const start = pointerStartRef.current;
                pointerStartRef.current = null;
                if (!start) return;
                const dx = event.clientX - start.x;
                const dy = event.clientY - start.y;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
              }}
              onPointerCancel={() => { pointerStartRef.current = null; }}
            >
              <button type="button" className="project-lightbox__control project-lightbox__prev" onClick={() => move(-1)} aria-label="Previous photograph" disabled={images.length < 2}>
                <IconChevronLeft size={24} />
              </button>
              <figure className="project-lightbox__figure">
                <LightboxPhoto key={src} src={src} alt={`${project.title}, photograph ${index + 1} of ${images.length}`} />
              </figure>
              <button type="button" className="project-lightbox__control project-lightbox__next" onClick={() => move(1)} aria-label="Next photograph" disabled={images.length < 2}>
                <IconChevronRight size={24} />
              </button>
            </div>

            <aside className="project-lightbox__details">
              <span className="project-lightbox__eyebrow">{detailsLabel}</span>
              <h2>{currentPhoto?.filename || project.title}</h2>
              {project.description && <p>{project.description}</p>}
              <div className="project-lightbox__photo-label">
                <span>Photograph</span><span>{photoNumber(index)}</span>
              </div>
              {onDownload ? (
                <button type="button" className="project-lightbox__download" onClick={() => onDownload(currentPhoto)} disabled={downloadBusy}>
                  <IconDownload size={17} /><span>{downloadBusy ? "Preparing download…" : "Download photograph"}</span>
                </button>
              ) : (
                <a href={src.replace("/upload/", "/upload/fl_attachment/")} download={`${project.title}-${index + 1}.jpg`} className="project-lightbox__download">
                  <IconDownload size={17} /><span>Download photograph</span>
                </a>
              )}
              {photoActions}
            </aside>
          </div>

          <footer className="project-lightbox__footer">
            <nav className="project-lightbox__thumbnails" aria-label="Choose a photograph" ref={thumbnailStripRef}>
              {images.map((image, i) => (
                <button key={`${image}-${i}`} type="button" className="project-lightbox__thumbnail" aria-label={`View photograph ${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => onSelect(i)}>
                  <img src={photoItems?.[i]?.thumbnailUrl || image.replace("/upload/", "/upload/c_fill,w_144,h_144,q_auto,f_auto/")} alt="" loading="lazy" draggable={false} />
                  <span>{photoNumber(i)}{selectedPhotoIds?.has(photoItems?.[i]?.publicId) ? " ✓" : ""}</span>
                </button>
              ))}
            </nav>
            <div className="project-lightbox__hints">
              <span className="project-lightbox__keyboard-hint">← → Browse photographs <span>·</span> Esc to close</span>
              <span className="project-lightbox__touch-hint">Swipe to explore</span>
              <span>{project.title}</span>
            </div>
          </footer>
        </div>
      )}
    </Modal>
  );
}
