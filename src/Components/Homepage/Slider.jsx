import React, { useState, useEffect, useCallback } from "react";
import "../../Style/Slider.css";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Title,
  Button,
  UnstyledButton,
  Paper,
  Text,
  Image,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { IconCaretLeft, IconCaretRight } from "@tabler/icons-react";
import WheelGestures from "embla-carousel-wheel-gestures";
import { width } from "@fortawesome/free-solid-svg-icons/fa0";

function Slider({ items }) {
  const [embla, setEmbla] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const navigate = useNavigate();

  const onSelect = useCallback((emblaApi) => {
    setCanScrollLeft(emblaApi.canScrollPrev());
    setCanScrollRight(emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (embla) {
      embla.on("select", onSelect);
      onSelect(embla);
    }
  }, [embla, onSelect]);

  return (
    <Box className="slider-container">
      <Box className="slider-box">
        <Carousel
          slideSize={{ base: "100%", sm: "50%", md: "33.33%" }}
          slideGap="xl"
          align="start"
          slidesToScroll={1}
          withControls
          plugins={[WheelGestures()]}
          withIndicators
          previousControlIcon={<IconCaretLeft size={15} />}
          nextControlIcon={<IconCaretRight size={15} />}
          getEmblaApi={setEmbla}
          classNames={{
            container: "slider",
            controls: "slider-btn",
            indicator: "indicator",
          }}
          emblaOptions={{
            loop: true,
            dragFree: true,
            align: "start",
          }}
        >
          {items.map((item, i) => (
            <Carousel.Slide
              key={i}
              onClick={() => {
                navigate("/portfolio");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Paper
                shadow="md"
                radius="xs"
                style={{
                  overflow: "hidden",
                  cursor: "pointer",
                  height: "100%",
                }}
              >
                <Box style={{ position: "relative" }}>
                  <Image
                    src={item.image}
                    height={500}
                    fit="cover"
                    alt={item.title}
                    className="slider-item-img"
                  />
                  <Box
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "20px",
                      background:
                        "linear-gradient(transparent, rgba(0,0,0,0.8))",
                      color: "white",
                    }}
                  >
                    <Text fw={700} size="xl">
                      {item.title}
                    </Text>
                  </Box>
                </Box>
              </Paper>
            </Carousel.Slide>
          ))}
        </Carousel>
      </Box>
      <Button
        className="btn"
        onClick={() => {
          navigate("/portfolio");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        m="lg"
      >
        View More
      </Button>
    </Box>
  );
}

export default Slider;
