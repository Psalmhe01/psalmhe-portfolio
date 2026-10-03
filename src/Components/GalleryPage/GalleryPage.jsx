// src/Components/GalleryPage/GalleryPage.jsx

import { isAdminUser } from "../../adminAccess";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGallery } from "../../Hooks/useGallery.js";
import {
  Center,
  Loader,
  Text,
  Paper,
  Title,
  PasswordInput,
  Button,
  Stack,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useAuth } from "../../Context/AuthContext.jsx";

import {
  loadGoogleFont,
  downloadSinglePhoto,
  downloadAllPhotosAsZip,
} from "./utils";
import GalleryCover from "./components/GalleryCover";
import PhotoGrid from "./components/PhotoGrid";
import GalleryLightbox from "./components/GalleryLightbox";
import GalleryToolbar from "./components/GalleryToolbar";
import "../../Style/ClientGallery.css";

const EMPTY_PHOTOS = [];

export default function GalleryPage({ isAdmin = false }) {
  const { slug } = useParams();
  const { user } = useAuth();
  const { gallery, loading, error, updateGallery, deletePhoto, unlock } =
    useGallery(slug, isAdmin && isAdminUser(user));

  const [passwordInput, setPasswordInput] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lightboxPhotoId, setLightboxPhotoId] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [downloadingBatch, setDownloadingBatch] = useState(null);
  const [downloadingPhoto, setDownloadingPhoto] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const downloadLockRef = useRef(false);
  const photos = gallery?.photos || EMPTY_PHOTOS;
  const selectedPhotos = useMemo(() => photos.filter((photo) => selectedIds.has(photo.publicId)), [photos, selectedIds]);
  const lightboxIndex = lightboxPhotoId === null ? -1 : photos.findIndex((photo) => photo.publicId === lightboxPhotoId);
  const downloadBusy = downloadingBatch !== null || downloadingPhoto !== null;
  const progressLabel = downloadProgress?.phase === "packaging"
    ? "Creating ZIP…"
    : `Preparing ${downloadProgress?.completed || 0} / ${downloadProgress?.total || 0}`;

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
    setLightboxPhotoId(null);
  }, [slug]);

  useEffect(() => {
    const availableIds = new Set(photos.map((photo) => photo.publicId));
    setSelectedIds((previous) => {
      const remaining = new Set([...previous].filter((id) => availableIds.has(id)));
      return remaining.size === previous.size ? previous : remaining;
    });
  }, [photos]);

  const startSelecting = () => {
    if (!downloadLockRef.current) setSelectionMode(true);
  };

  const finishSelecting = () => {
    if (downloadLockRef.current) return;
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id) => {
    if (!selectionMode || downloadLockRef.current) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (gallery?.titleFont) loadGoogleFont(gallery.titleFont);
  }, [gallery?.titleFont]);

  const canView = Boolean(gallery);
  const handleUnlock = async () => {
    if (checking) return;
    setChecking(true);
    setWrongPassword(false);
    try {
      await unlock(passwordInput);
      setPasswordInput("");
    } catch (err) {
      setWrongPassword(true);
      notifications.show({ message: err.message, color: "red" });
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = useCallback(async (photo) => {
    if (!photo || downloadLockRef.current) return;
    downloadLockRef.current = true;
    setDownloadingPhoto(photo.publicId);
    try {
      await downloadSinglePhoto(photo);
    } finally {
      downloadLockRef.current = false;
      setDownloadingPhoto(null);
    }
  }, []);

  const handleDownloadBatch = async (type) => {
    if (downloadLockRef.current) return;
    const chosenPhotos = type === "selected" ? selectedPhotos : photos;
    if (!chosenPhotos.length) return;
    downloadLockRef.current = true;
    setDownloadingBatch(type);
    setDownloadProgress({ phase: "fetching", completed: 0, total: chosenPhotos.length });
    try {
      await downloadAllPhotosAsZip(gallery.name, chosenPhotos, {
        selected: type === "selected",
        onProgress: setDownloadProgress,
      });
    } finally {
      downloadLockRef.current = false;
      setDownloadingBatch(null);
      setDownloadProgress(null);
    }
  };

  const handleOpenLightbox = (photo) => setLightboxPhotoId(photo.publicId);
  const closeLightbox = () => setLightboxPhotoId(null);

  const handleDeletePhoto = (photoPublicId, photoFilename) => {
    modals.openConfirmModal({
      title: "Delete Photo",
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{photoFilename}</strong>?
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deletePhoto(slug, photoPublicId);
          notifications.show({
            message: `${photoFilename} deleted.`,
            color: "green",
          });
        } catch (err) {
          notifications.show({
            message: `Failed: ${err.message}`,
            color: "red",
          });
        }
      },
    });
  };

  const handleSetCover = async (photoPublicId) => {
    try {
      await updateGallery(slug, { coverPhotoId: photoPublicId });
      notifications.show({ message: "Cover updated!", color: "green" });
    } catch (err) {
      notifications.show({
        message: `Failed: ${err.message}`,
        color: "red",
      });
    }
  };

  // ── Loading / Error ────────────────────────────────

  if (loading) {
    return (
      <Center h="100vh" bg="dark.9">
        <Stack align="center" gap="sm">
          <Loader color="yellow.6" size="md" />
          <Text c="dimmed" size="sm">
            Loading gallery…
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh" bg="dark.9">
        <Text c="red.4">{error}</Text>
      </Center>
    );
  }

  // ── Password Gate ──────────────────────────────────

  if (!canView) {
    return (
      <Center h="100vh" bg="dark.9" p="md">
        <Paper
          withBorder
          p="xl"
          radius={0}
          w="100%"
          maw={420}
          bg="dark.8"
          style={{ borderColor: "var(--mantine-color-dark-6)" }}
        >
          <Stack align="center" gap="xs" mb="lg">
            <Text size="2rem">🔒</Text>
            <Title order={2} fw={400} c="gray.1" ta="center">
              {gallery?.name || "Your Photo Gallery"}
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              This gallery is password protected.
            </Text>
          </Stack>
          <Stack gap="sm">
            <PasswordInput
              placeholder="Gallery password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              error={wrongPassword ? "Unable to unlock. Check the password and try again." : undefined}
              maxLength={128}
              autoComplete="current-password"
              autoFocus
            />
            <Button
              fullWidth
              color="yellow.6"
              c="dark.9"
              onClick={handleUnlock}
              loading={checking}
              radius={0}
            >
              Enter Gallery →
            </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  // ── Gallery View ───────────────────────────────────

  const bg =
    gallery.colorTheme === "chalk" ||
    gallery.colorTheme === "cream" ||
    gallery.colorTheme === "ivory"
      ? gallery.colorTheme === "chalk"
        ? "#f8f5f0"
        : gallery.colorTheme === "cream"
          ? "#faf7f2"
          : "#f5f2eb"
      : "#0d0d0d";

  return (
    <Box className="client-gallery" style={{ background: bg, minHeight: "100vh", "--gallery-canvas": bg, "--gallery-ink": bg === "#0d0d0d" ? "#f1eee7" : "#34302a", "--gallery-muted": bg === "#0d0d0d" ? "#aaa69c" : "#70695f", color: "var(--gallery-ink)" }}>
      {isAdmin && gallery.needsMigration && <Text c="red" ta="center" p="md">Set a new password from Manage Galleries to enable client access.</Text>}
      {/* Cover */}
      <GalleryCover gallery={gallery} isAdmin={isAdmin} />

      {photos.length > 0 && (
        <GalleryToolbar
          selectionMode={selectionMode}
          onStartSelecting={startSelecting}
          onFinishSelecting={finishSelecting}
          total={photos.length}
          selectedCount={selectedPhotos.length}
          onSelectAll={() => setSelectedIds(new Set(photos.map((photo) => photo.publicId)))}
          onClear={() => setSelectedIds(new Set())}
          onDownloadSelected={() => handleDownloadBatch("selected")}
          onDownloadAll={() => handleDownloadBatch("all")}
          downloadBusy={downloadBusy}
          batchType={downloadingBatch}
          progressLabel={progressLabel}
        />
      )}

      {/* Grid */}
      <Box px={{ base: "sm", sm: "xl" }} pb={80}>
        {photos.length === 0 ? (
          <Center h={300}>
            <Text c="dimmed">
              {isAdmin ? "No photos yet. Upload some!" : "No photos yet."}
            </Text>
          </Center>
        ) : (
          <PhotoGrid
            photos={photos}
            layout={gallery.layout || "masonry"}
            gridGap={gallery.gridGap || "sm"}
            gridCols={gallery.gridCols || 3}
            hoverEffect={gallery.hoverEffect || "zoom"}
            isAdmin={isAdmin}
            onOpenLightbox={handleOpenLightbox}
            onDownload={handleDownload}
            onDelete={handleDeletePhoto}
            onSetCover={handleSetCover}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            selectionDisabled={downloadBusy}
            downloadBusy={downloadBusy}
          />
        )}
      </Box>

      <GalleryLightbox
        gallery={gallery}
        photos={photos}
        index={lightboxIndex >= 0 ? lightboxIndex : null}
        onClose={closeLightbox}
        onNavigate={(index) => setLightboxPhotoId(photos[index].publicId)}
        onDownload={handleDownload}
        selectionMode={selectionMode}
        onStartSelecting={startSelecting}
        onFinishSelecting={finishSelecting}
        selectedIds={selectedIds}
        selectedCount={selectedPhotos.length}
        onToggleSelection={toggleSelection}
        onDownloadSelected={() => handleDownloadBatch("selected")}
        downloadBusy={downloadBusy}
        batchDownloading={downloadingBatch !== null}
        progressLabel={progressLabel}
      />
    </Box>
  );
}
