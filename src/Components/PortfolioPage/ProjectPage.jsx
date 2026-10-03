import React, { useState, useEffect } from "react";
import categories from "../../Files/PortImages.jsx";
import "../../Style/ProjectPage.css";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Title,
  Text,
  Image,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowsMaximize,
} from "@tabler/icons-react";

import ProjectLightbox from "./ProjectLightbox.jsx";

function ProjectPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [dynamicImages, setDynamicImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(null);

  const found = categories.find((item) => {
    if (!item || !item.title || !category) return false;
    return item.title.toLowerCase() === String(category).toLowerCase();
  });

  useEffect(() => {
    const controller = new AbortController();
    setCurrentIndex(null);
    setDynamicImages([]);
    setLoadError(false);
    if (!found?.tag) {
      setDynamicImages(found?.image || []);
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    const cloudName = "dwzx3jib2";
    fetch(`https://res.cloudinary.com/${cloudName}/image/list/${found.tag}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load collection");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.resources)) throw new Error("Invalid collection response");
        const urls = data.resources.map((resource) =>
          `https://res.cloudinary.com/${cloudName}/image/upload/v${resource.version}/${resource.public_id}.${resource.format}`,
        );
        if (!controller.signal.aborted) setDynamicImages(urls);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [found, retryCount]);

  if (!found) {
    return (
      <Box py="xl" ta="center">
        <Text>Category "{category}" not found</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box py={100} ta="center" role="status">
        <Text>Loading collection…</Text>
      </Box>
    );
  }

  const descript = found.description;
  const cover = dynamicImages[0];
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
      {cover && <Image src={cover} alt={`${projectName} cover`} component="img" />}
      <Box className="name-descript">
        <div>
          <span className="project-eyebrow">Selected works / {String(currentProjectIndex + 1).padStart(2, "0")}</span>
          <Title order={1}>{projectName}</Title>
        </div>
        <Text component="p">{descript}</Text>
      </Box>
      <div className="project-gallery-heading">
        <span>{dynamicImages.length} {dynamicImages.length === 1 ? "photograph" : "photographs"}</span>
        <span>Select a photograph to explore</span>
      </div>
      {loadError ? (
        <Box py="xl" ta="center" role="status">
          <Text>We couldn’t load this collection.</Text>
          <UnstyledButton className="project-retry" onClick={() => setRetryCount((count) => count + 1)}>Try again</UnstyledButton>
        </Box>
      ) : dynamicImages.length === 0 ? (
        <Box py="xl" ta="center"><Text>Photographs will be added to this collection soon.</Text></Box>
      ) : (
        <Box className="page-images">
          {dynamicImages.map((item, i) => (
            <button key={item} type="button" className="page-image-item" onClick={() => setCurrentIndex(i)} aria-label={`View ${projectName}, photograph ${i + 1}`}>
              <img src={item} alt={`${projectName} ${i + 1}`} loading="lazy" decoding="async" />
              <span className="page-image-caption" aria-hidden="true">
                <span>{String(i + 1).padStart(2, "0")} / {projectName}</span>
                <IconArrowsMaximize size={18} />
              </span>
            </button>
          ))}
        </Box>
      )}

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

      <ProjectLightbox
        images={dynamicImages}
        index={currentIndex}
        project={found}
        onClose={() => setCurrentIndex(null)}
        onSelect={setCurrentIndex}
      />
    </Box>
  );
}

export default ProjectPage;
