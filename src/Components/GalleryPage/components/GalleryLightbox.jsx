import { useMemo } from "react";
import { IconCheck, IconChecks, IconDownload } from "@tabler/icons-react";
import ProjectLightbox from "../../PortfolioPage/ProjectLightbox";

export default function GalleryLightbox({
  gallery, photos, index, onClose, onNavigate, onDownload,
  selectionMode, onStartSelecting, onFinishSelecting,
  selectedIds, selectedCount, onToggleSelection, onDownloadSelected,
  downloadBusy, batchDownloading, progressLabel,
}) {
  const images = useMemo(() => photos.map((photo) => photo.url), [photos]);
  const project = useMemo(() => ({ title: gallery.name, description: gallery.description }), [gallery.name, gallery.description]);
  const photo = index !== null ? photos[index] : null;
  const selected = Boolean(photo && selectedIds.has(photo.publicId));

  return (
    <ProjectLightbox
      className="client-gallery-lightbox"
      images={images}
      photoItems={photos}
      index={index}
      project={project}
      eyebrow="Psalmhe / Client gallery"
      detailsLabel="Your photographs"
      onClose={onClose}
      onSelect={onNavigate}
      onDownload={onDownload}
      downloadBusy={downloadBusy}
      selectedPhotoIds={selectionMode ? selectedIds : undefined}
      photoActions={photo && (selectionMode ? (
        <div className="client-viewer-selection">
          <button type="button" className="client-viewer-select" aria-pressed={selected} disabled={downloadBusy} onClick={() => onToggleSelection(photo.publicId)}>
            <span className="client-viewer-select__check">{selected && <IconCheck size={16} />}</span>
            {selected ? "Selected for download" : "Select for download"}
          </button>
          <button type="button" className="project-lightbox__download client-viewer-batch" disabled={downloadBusy || selectedCount === 0} onClick={onDownloadSelected}>
            <IconDownload size={17} />
            <span>{batchDownloading ? progressLabel : `Download selected (${selectedCount})`}</span>
          </button>
          <div className="client-viewer-selection__footer">
            <span className="client-viewer-selection__note" role="status">{batchDownloading ? progressLabel : `${selectedCount} selected in this gallery`}</span>
            <button type="button" className="client-viewer-done" disabled={downloadBusy} onClick={onFinishSelecting}>Done selecting</button>
          </div>
        </div>
      ) : (
        <div className="client-viewer-selection">
          <button type="button" className="client-viewer-select" disabled={downloadBusy} onClick={onStartSelecting} aria-expanded={false}>
            <IconChecks size={18} /> Select images
          </button>
        </div>
      ))}
    />
  );
}
