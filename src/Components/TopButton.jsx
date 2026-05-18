import { useEffect, useState } from "react";
import { ActionIcon, Box } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    isVisible && (
      <Box
        component="button"
        onClick={scrollToTop}
        title="Back to Top"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 100,
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <ActionIcon size="lg" radius="md" variant="filled">
          <IconArrowUp size={16} />
        </ActionIcon>
      </Box>
    )
  );
}

export default BackToTopButton;
