import React, { useState, useRef, useEffect, useCallback } from "react";
import categories from "../../Files/PortImages.jsx";
import "../../Style/ProjectPage.css";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Title,
  Text,
  Image,
  Group,
  Modal,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconDownload,
} from "@tabler/icons-react";

function ProjectPage() {
  const { category } = useParams();
  const navigate = useNavigate();

  const found = categories.find((item) => {
    if (!item || !item.title || !category) return false;
    return item.title.toLowerCase() === String(category).toLowerCase();
  });

  const [currentIndex, setCurrentIndex] = useState(null);
  const lastFocusedRef = useRef(null);

  const openLightbox = (index) => {
    lastFocusedRef.current = document.activeElement;
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setCurrentIndex(null);
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

  const prevImage = useCallback(() => {
    setCurrentIndex((idx) => (idx === 0 ? found.image.length - 1 : idx - 1));
  }, [found.image.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex((idx) => (idx === found.image.length - 1 ? 0 : idx + 1));
  }, [found.image.length]);

  useEffect(() => {
    if (currentIndex === null) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, closeLightbox, prevImage, nextImage]);

  if (!found) {
    return (
      <Box py="xl" ta="center">
        <Text>Category "{category}" not found</Text>
      </Box>
    );
  }

  const descript = found.description;
  const cover = found.image[0];
  const projectName = found.title; // Use found.title for the project name

  // Logic for previous/next projects
  const currentProjectIndex = categories.findIndex(
    (item) => item.title.toLowerCase() === String(category).toLowerCase(),
  );

  const prevProjectIndex =
    currentProjectIndex === 0 ? categories.length - 1 : currentProjectIndex - 1;
  const nextProjectIndex =
    currentProjectIndex === categories.length - 1 ? 0 : currentProjectIndex + 1;

  const prevProject = categories[prevProjectIndex];
  const nextProject = categories[nextProjectIndex];

  return (
    <Box className="page-container">
      <Image src={cover} alt={`${projectName} cover`} component="img" />
      <Box className="name-descript">
        <Title order={1}>{projectName}</Title>
        <Text component="p">{descript}</Text>
      </Box>
      <Box className="page-images">
        {found.image.map((item, i) => (
          <Image
            key={i}
            src={item}
            alt={`${projectName} ${i + 1}`}
            className="page-image-item"
            component="img"
            onClick={() => openLightbox(i)}
          />
        ))}
      </Box>

      <Box className="page-ref">
        {/* Previous Project Button */}
        <UnstyledButton
          className="page-ref-btn"
          onClick={() => {
            navigate(`/portfolio/${prevProject.title}`);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <IconChevronLeft size={16} />
          Previous Project
        </UnstyledButton>

        <UnstyledButton
          className="page-ref-btn"
          onClick={() => {
            navigate("/portfolio");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Back to Portfolio
        </UnstyledButton>

        {/* Next Project Button */}
        <UnstyledButton
          className="page-ref-btn"
          onClick={() => {
            navigate(`/portfolio/${nextProject.title}`);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Next Project
          <IconChevronRight size={16} />
        </UnstyledButton>
      </Box>

      <Modal
        opened={currentIndex !== null}
        onClose={closeLightbox}
        centered
        withCloseButton={false}
        fullScreen // Use fullScreen to ensure it covers the entire viewport
        zIndex={2000}
        styles={{
          // Ensure Mantine's internal content and body have no padding/background
          content: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            alignContent: "center",
          },
          body: {
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }, // Center the lightbox-content
        }}
        overlayProps={{ backgroundOpacity: 0.8, color: "#000" }}
      >
        <Box className="lightbox-content">
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <IconX size={24} />
          </button>

          <a
            href={lightboxSrc}
            download={`${projectName}-${currentIndex + 1}.jpg`}
            className="lightbox-download"
            aria-label="Download"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconDownload size={24} />
          </a>

          <button
            className="lightbox-prev"
            onClick={prevImage}
            aria-label="Previous"
          >
            <IconChevronLeft size={32} />
          </button>

          <img src={lightboxSrc} alt={`Enlarged ${projectName}`} />

          <button
            className="lightbox-next"
            onClick={nextImage}
            aria-label="Next"
          >
            <IconChevronRight size={32} />
          </button>
        </Box>
      </Modal>
    </Box>
  );
}

export default ProjectPage;
