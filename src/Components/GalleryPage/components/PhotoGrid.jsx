import { Box, Button, Group } from "@mantine/core";
import {
  IconDownload,
  IconDownloadOff,
  IconTrash,
  IconPhotoUp,
} from "@tabler/icons-react";
import PhotoCard from "./PhotoCard";

export default function PhotoGrid({
  photos,
  layout,
  gridGap,
  gridCols,
  hoverEffect,
  isAdmin,
  isDownloadingAll,
  onOpenLightbox,
  onDownload,
  onDownloadAll,
  onDelete,
  onSetCover,
}) {
  const gapMap = { none: "0px", sm: "8px", md: "14px", lg: "24px" };
  const gap = gapMap[gridGap || "sm"];
  const cols = gridCols || 3;

  const hoverClass =
    hoverEffect === "fade"
      ? "hover-fade"
      : hoverEffect === "none"
        ? ""
        : "hover-zoom";

  return (
    <>
      <style>{`
        .photo-item { position: relative; overflow: hidden; cursor: pointer; border-radius: 3px; }
        .photo-item img { width: 100%; display: block; transition: transform 0.4s ease, opacity 0.3s ease; }
        .hover-zoom .photo-item:hover img { transform: scale(1.04); }
        .hover-fade .photo-item:hover img { opacity: 0.82; }
        .masonry-wrap { column-gap: ${gap}; }
        .masonry-wrap .photo-item { break-inside: avoid; margin-bottom: ${gap}; }
        .grid-wrap .photo-item img { aspect-ratio: 1; object-fit: cover; height: 100%; }
        .rows-wrap .photo-item img { max-height: 340px; width: 100%; object-fit: cover; }
        .photo-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 52%); opacity: 0; transition: opacity 0.28s ease; display: flex; align-items: flex-end; padding: 10px; }
        .photo-item:hover .photo-overlay, .photo-overlay.admin-visible { opacity: 1; }
      `}</style>

      {onDownloadAll && (
        <Box
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            size="xs"
            variant="outline"
            color="gray"
            radius={0}
            leftSection={<IconDownload size={13} />}
            onClick={() => onDownloadAll()}
            loading={isDownloadingAll}
            disabled={isDownloadingAll}
          >
            Download All
          </Button>
        </Box>
      )}

      {layout === "masonry" ? (
        <div
          className={`masonry-wrap ${hoverClass}`}
          style={{
            columnCount: Math.max(1, cols - 1),
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.publicId}
              photo={photo}
              index={i}
              isAdmin={isAdmin}
              onOpenLightbox={onOpenLightbox}
              onDownload={onDownload}
              onDelete={onDelete}
              onSetCover={onSetCover}
              isMasonry
            />
          ))}
        </div>
      ) : layout === "rows" ? (
        <div
          className={`rows-wrap ${hoverClass}`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap,
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.publicId}
              photo={photo}
              index={i}
              isAdmin={isAdmin}
              onOpenLightbox={onOpenLightbox}
              onDownload={onDownload}
              onDelete={onDelete}
              onSetCover={onSetCover}
            />
          ))}
        </div>
      ) : (
        <div
          className={`grid-wrap ${hoverClass}`}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${layout === "compact" ? cols + 1 : cols}, 1fr)`,
            gap,
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.publicId}
              photo={photo}
              index={i}
              isAdmin={isAdmin}
              onOpenLightbox={onOpenLightbox}
              onDownload={onDownload}
              onDelete={onDelete}
              onSetCover={onSetCover}
            />
          ))}
        </div>
      )}
    </>
  );
}
