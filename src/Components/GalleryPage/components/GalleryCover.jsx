import { Box, Text, Stack } from "@mantine/core";

export default function GalleryCover({ gallery, isAdmin }) {
  const coverStyle = gallery.coverStyle || "fullbleed";
  const coverHeight = gallery.coverHeight || "medium";
  const titleFont = gallery.titleFont || "Cormorant Garamond";
  const titleSize = {
    sm: "clamp(1.4rem, 3vw, 2rem)",
    lg: "clamp(2rem, 4vw, 3rem)",
    xl: "clamp(2.6rem, 5vw, 4.2rem)",
    xxl: "clamp(3.2rem, 7vw, 6rem)",
  }[gallery.titleSize || "lg"];
  const titleWeight = gallery.titleWeight || 300;
  const titleSpacing = gallery.titleSpacing ?? 0.05;
  const overlayOpacity = gallery.overlayOpacity ?? 0.45;
  const photos = gallery.photos || [];
  const coverPhoto =
    photos.find((p) => p.publicId === gallery.coverPhotoId) || photos[0];

  const heightMap = {
    short: "35vh",
    medium: "55vh",
    tall: "72vh",
    fullscreen: "100vh",
  };
  const coverH = heightMap[coverHeight];

  const titleStyle = {
    fontFamily: titleFont,
    fontWeight: titleWeight,
    fontSize: titleSize,
    letterSpacing: `${titleSpacing}em`,
    color: "#f5f0e8",
    lineHeight: 1.05,
  };

  if (coverStyle === "minimal") {
    return (
      <Box ta="center" py={64} px="md">
        <Text style={{ ...titleStyle, color: "inherit" }}>{gallery.name}</Text>
        <Box
          style={{
            width: 40,
            height: 1,
            background: "currentColor",
            opacity: 0.3,
            margin: "16px auto 0",
          }}
        />
      </Box>
    );
  }

  return (
    <Box style={{ position: "relative", height: coverH, overflow: "hidden" }}>
      {coverPhoto && (
        <img
          src={coverPhoto.url}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      )}
      <Box
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0,0,0,${overlayOpacity})`,
          display: "flex",
          alignItems:
            coverStyle === "stripe" || coverStyle === "vintage"
              ? "flex-end"
              : "center",
          justifyContent: coverStyle === "novel" ? "flex-start" : "center",
        }}
      >
        {coverStyle === "stripe" && (
          <Box
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.7)",
              padding: "20px 40px",
            }}
          >
            <Text style={titleStyle}>{gallery.name}</Text>
          </Box>
        )}

        {coverStyle === "frame" && (
          <Box
            style={{
              border: "1.5px solid rgba(245,240,232,0.8)",
              padding: "20px 36px",
              margin: 24,
            }}
          >
            <Text style={{ ...titleStyle, textAlign: "center" }}>
              {gallery.name}
            </Text>
          </Box>
        )}

        {coverStyle === "novel" && (
          <Box style={{ padding: "0 0 32px 48px", maxWidth: "40%" }}>
            <Text style={titleStyle}>{gallery.name}</Text>
          </Box>
        )}

        {(coverStyle === "fullbleed" || coverStyle === "vintage") && (
          <Text
            style={{
              ...titleStyle,
              textAlign: "center",
              paddingBottom: coverStyle === "vintage" ? 32 : 0,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            {gallery.name}
          </Text>
        )}
      </Box>
    </Box>
  );
}
