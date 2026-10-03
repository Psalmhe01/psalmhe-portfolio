import { Button, Group, Text } from "@mantine/core";
import { IconDownload, IconChecks, IconX } from "@tabler/icons-react";

export default function GalleryToolbar({
  total, selectedCount, selectionMode, onStartSelecting, onFinishSelecting,
  onSelectAll, onClear, onDownloadSelected, onDownloadAll,
  downloadBusy, batchType, progressLabel,
}) {
  return (
    <section className="client-gallery-toolbar" aria-label="Photo selection and downloads">
      <div className="client-gallery-toolbar__summary">
        <Text size="sm" fw={500} aria-live="polite">
          {selectionMode ? `${selectedCount} of ${total} photos selected` : `${total} photos`}
        </Text>
        {(selectionMode || batchType) && (
          <Text size="xs" className="client-gallery-toolbar__hint" role="status">
            {batchType ? progressLabel : "Use the checkboxes to choose your photos."}
          </Text>
        )}
      </div>
      <Group gap="xs" className="client-gallery-toolbar__actions">
        {selectionMode ? (
          <>
            <Button variant="subtle" color="gray" size="xs" radius={0} leftSection={<IconChecks size={15} />} onClick={onSelectAll} disabled={downloadBusy || selectedCount === total}>Select all</Button>
            <Button variant="subtle" color="gray" size="xs" radius={0} leftSection={<IconX size={15} />} onClick={onClear} disabled={downloadBusy || selectedCount === 0}>Clear</Button>
            <Button color="yellow.6" c="dark.9" size="sm" radius={0} leftSection={<IconDownload size={16} />} onClick={onDownloadSelected} disabled={downloadBusy || selectedCount === 0} loading={batchType === "selected"}>Download selected ({selectedCount})</Button>
            <Button variant="outline" color="gray" size="sm" radius={0} onClick={onFinishSelecting} disabled={downloadBusy}>Done selecting</Button>
          </>
        ) : (
          <Button variant="outline" color="gray" size="sm" radius={0} leftSection={<IconChecks size={16} />} onClick={onStartSelecting} disabled={downloadBusy} aria-expanded={false}>Select images</Button>
        )}
        <Button variant="outline" color="gray" size="sm" radius={0} leftSection={<IconDownload size={16} />} onClick={onDownloadAll} disabled={downloadBusy} loading={batchType === "all"}>Download all</Button>
      </Group>
    </section>
  );
}
