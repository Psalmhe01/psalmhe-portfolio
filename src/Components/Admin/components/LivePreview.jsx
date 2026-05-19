import { Box, Text, Stack } from "@mantine/core";

export default function LivePreview({ gallery, config, viewport }) {
  const photos = gallery?.photos || [];
  const coverPhoto =
    photos.find((p) => p.publicId === config.coverPhotoId) || photos[0];
  const font = config.titleFont || "Cormorant Garamond";
  const gapMap = { none: 0, sm: 6, md: 12, lg: 20 };
  const gap = gapMap[config.gridGap || "sm"];
  const cols = config.gridCols || 3;
  const previewPhotos = photos.slice(0, 15);

  const coverHeightMap = {
    short: 140,
    medium: 220,
    tall: 310,
    fullscreen: 420,
  };
  const coverH = coverHeightMap[config.coverHeight || "medium"];

  const titleSizeMap = {
    sm: "1.4rem",
    lg: "2rem",
    xl: "2.8rem",
    xxl: "3.8rem",
  };
  const titleSize = titleSizeMap[config.titleSize || "lg"];

  const bg = "#0d0d0d";
  const fg = "#f5f0e8";

  return (
    <Box
      style={{
        background: bg,
        color: fg,
        fontFamily: font,
        height: "100%",
        overflowY: "auto",
      }}
    >
      {config.coverStyle !== "minimal" ? (
        <Box
          style={{
            position: "relative",
            height: coverH,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {coverPhoto && (
            <img
              src={coverPhoto.thumbnailUrl || coverPhoto.url}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          )}
          {!coverPhoto && (
            <Box
              style={{
                width: "100%",
                height: "100%",
                background: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text size="xs" c="dimmed">
                No cover photo set
              </Text>
            </Box>
          )}
          <Box
            style={{
              position: "absolute",
              inset: 0,
              background: `rgba(0,0,0,${config.overlayOpacity ?? 0.45})`,
              display: "flex",
              alignItems:
                config.coverStyle === "stripe" ||
                config.coverStyle === "vintage"
                  ? "flex-end"
                  : "center",
              justifyContent:
                config.coverStyle === "novel" ? "flex-start" : "center",
            }}
          >
            {config.coverStyle === "stripe" && (
              <Box
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.72)",
                  padding: "10px 16px",
                }}
              >
                <Text
                  style={{
                    fontFamily: font,
                    fontSize: titleSize,
                    fontWeight: config.titleWeight || 300,
                    letterSpacing: `${config.titleSpacing ?? 0.05}em`,
                    color: fg,
                    lineHeight: 1.1,
                  }}
                >
                  {gallery?.name || "Gallery"}
                </Text>
              </Box>
            )}
            {config.coverStyle === "frame" && (
              <Box
                style={{
                  border: `1.5px solid ${fg}`,
                  padding: "10px 18px",
                  margin: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: font,
                    fontSize: titleSize,
                    fontWeight: config.titleWeight || 300,
                    letterSpacing: `${config.titleSpacing ?? 0.05}em`,
                    color: fg,
                    textAlign: "center",
                  }}
                >
                  {gallery?.name || "Gallery"}
                </Text>
              </Box>
            )}
            {(config.coverStyle === "fullbleed" ||
              config.coverStyle === "vintage" ||
              config.coverStyle === "novel") && (
              <Text
                style={{
                  fontFamily: font,
                  fontSize: titleSize,
                  fontWeight: config.titleWeight || 300,
                  letterSpacing: `${config.titleSpacing ?? 0.05}em`,
                  color: fg,
                  lineHeight: 1.1,
                  textAlign: config.coverStyle === "novel" ? "left" : "center",
                  padding:
                    config.coverStyle === "novel"
                      ? "0 0 16px 16px"
                      : config.coverStyle === "vintage"
                        ? "0 0 16px 0"
                        : 0,
                }}
              >
                {gallery?.name || "Gallery"}
              </Text>
            )}
          </Box>
        </Box>
      ) : (
        <Box style={{ padding: "28px 20px 12px", textAlign: "center" }}>
          <Text
            style={{
              fontFamily: font,
              fontSize: titleSize,
              fontWeight: config.titleWeight || 300,
              letterSpacing: `${config.titleSpacing ?? 0.05}em`,
              color: fg,
            }}
          >
            {gallery?.name || "Gallery"}
          </Text>
          <Box
            style={{
              width: 32,
              height: 1,
              background: "#c9a96e",
              margin: "10px auto 0",
            }}
          />
        </Box>
      )}

      <Box style={{ padding: gap }}>
        {previewPhotos.length === 0 ? (
          <Box style={{ padding: 20, textAlign: "center", opacity: 0.3 }}>
            <Text size="xs">No photos yet</Text>
          </Box>
        ) : config.layout === "masonry" ? (
          <div style={{ columnCount: Math.max(2, cols - 1), columnGap: gap }}>
            {previewPhotos.map((p) => (
              <div
                key={p.publicId}
                style={{ breakInside: "avoid", marginBottom: gap }}
              >
                <img
                  src={p.thumbnailUrl || p.url}
                  alt=""
                  style={{ width: "100%", display: "block", borderRadius: 2 }}
                />
              </div>
            ))}
          </div>
        ) : config.layout === "rows" ? (
          <Stack gap={gap}>
            {previewPhotos.map((p) => (
              <img
                key={p.publicId}
                src={p.thumbnailUrl || p.url}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 160,
                  objectFit: "cover",
                  borderRadius: 2,
                }}
              />
            ))}
          </Stack>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${config.layout === "compact" ? cols + 1 : cols}, 1fr)`,
              gap,
            }}
          >
            {previewPhotos.map((p) => (
              <img
                key={p.publicId}
                src={p.thumbnailUrl || p.url}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        )}
      </Box>
    </Box>
  );
}
