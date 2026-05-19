import { Button, Group } from "@mantine/core";
import { IconDownload, IconTrash, IconPhotoUp } from "@tabler/icons-react";

export default function PhotoCard({
  photo,
  index,
  isAdmin,
  onOpenLightbox,
  onDownload,
  onDelete,
  onSetCover,
  isMasonry,
}) {
  return (
    <div className="photo-item" onClick={() => onOpenLightbox(photo, index)}>
      <img
        src={photo.thumbnailUrl || photo.url}
        alt={photo.filename || `Photo ${index + 1}`}
        loading="lazy"
        style={isMasonry ? {} : { height: "100%" }}
      />
      <div className={`photo-overlay${isAdmin ? " admin-visible" : ""}`}>
        <Group
          justify="space-between"
          w="100%"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="xs"
            variant="outline"
            color="gray.0"
            radius={0}
            onClick={() => onDownload(photo)}
            leftSection={<IconDownload size={13} />}
          >
            Save
          </Button>
          {isAdmin && (
            <Group gap={4}>
              <Button
                size="xs"
                variant="subtle"
                color="gray.0"
                radius={0}
                onClick={() => onSetCover(photo.publicId)}
                title="Set as cover"
              >
                <IconPhotoUp size={13} />
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="red.4"
                radius={0}
                onClick={() => onDelete(photo.publicId, photo.filename)}
              >
                <IconTrash size={13} />
              </Button>
            </Group>
          )}
        </Group>
      </div>
    </div>
  );
}
