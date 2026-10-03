import { Button, Group } from "@mantine/core";
import { IconDownload, IconTrash, IconPhotoUp } from "@tabler/icons-react";

export default function PhotoCard({
  photo, index, isAdmin, onOpenLightbox, onDownload, onDelete, onSetCover,
  selectionMode, selected, onToggleSelection, selectionDisabled, downloadBusy,
}) {
  const name = photo.filename || `Photo ${index + 1}`;

  return (
    <div className="client-photo" data-selected={selectionMode && selected}>
      <button type="button" className="client-photo__open" onClick={() => onOpenLightbox(photo, index)} aria-label={`View ${name}`}>
        <img src={photo.thumbnailUrl || photo.url} alt={name} loading="lazy" decoding="async" />
      </button>
      {selectionMode && (
        <label className="client-photo__selection" title={selected ? "Remove from selection" : "Select for download"}>
          <input type="checkbox" checked={selected} disabled={selectionDisabled} onChange={() => onToggleSelection(photo.publicId)} aria-label={`Select ${name} for download`} />
        </label>
      )}
      <div className={`client-photo__overlay${isAdmin ? " client-photo__overlay--admin" : ""}`}>
        <Group justify="space-between" w="100%" gap={4}>
          <Button size="xs" variant="outline" color="gray.0" radius={0} disabled={downloadBusy} onClick={() => onDownload(photo)} leftSection={<IconDownload size={13} />} aria-label={`Download ${name}`}>Save</Button>
          {isAdmin && (
            <Group gap={4}>
              <Button size="xs" variant="subtle" color="gray.0" radius={0} onClick={() => onSetCover(photo.publicId)} title="Set as cover" aria-label={`Set ${name} as gallery cover`}><IconPhotoUp size={16} /></Button>
              <Button size="xs" variant="subtle" color="red.4" radius={0} onClick={() => onDelete(photo.publicId, photo.filename)} aria-label={`Delete ${name}`}><IconTrash size={16} /></Button>
            </Group>
          )}
        </Group>
      </div>
    </div>
  );
}
