import PhotoCard from "./PhotoCard";

export default function PhotoGrid({
  photos, layout, gridGap, gridCols, hoverEffect, isAdmin,
  onOpenLightbox, onDownload, onDelete, onSetCover,
  selectionMode, selectedIds, onToggleSelection, selectionDisabled, downloadBusy,
}) {
  const gapMap = { none: "0px", sm: "8px", md: "14px", lg: "24px" };
  const cols = gridCols || 3;
  const columnCount = layout === "compact" ? cols + 1 : layout === "masonry" ? Math.max(1, cols - 1) : cols;

  return (
    <div className={`client-photo-grid client-photo-grid--${layout} client-photo-grid--${hoverEffect}`} style={{ "--gallery-gap": gapMap[gridGap] || gapMap.sm, "--gallery-columns": columnCount, "--gallery-mobile-columns": Math.min(columnCount, 2) }}>
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.publicId}
          photo={photo}
          index={index}
          isAdmin={isAdmin}
          onOpenLightbox={onOpenLightbox}
          onDownload={onDownload}
          onDelete={onDelete}
          onSetCover={onSetCover}
          selectionMode={selectionMode}
          selected={selectedIds.has(photo.publicId)}
          onToggleSelection={onToggleSelection}
          selectionDisabled={selectionDisabled}
          downloadBusy={downloadBusy}
        />
      ))}
    </div>
  );
}
