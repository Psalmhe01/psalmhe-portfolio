// src/Components/GalleryPage/GalleryPage.jsx

import { isAdminUser } from "../../adminAccess";
import { useState, useCallback, useEffect } from "react";
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
  Modal,
  Image,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useAuth } from "../../Context/AuthContext.jsx";
import { Group } from "@mantine/core";

import {
  loadGoogleFont,
  downloadSinglePhoto,
  downloadAllPhotosAsZip,
} from "./utils";
import GalleryCover from "./components/GalleryCover";
import PhotoGrid from "./components/PhotoGrid";

export default function GalleryPage({ isAdmin = false }) {
  const { slug } = useParams();
  const { user } = useAuth();
  const { gallery, loading, error, updateGallery, deletePhoto, unlock } =
    useGallery(slug, isAdmin && isAdminUser(user));

  const [passwordInput, setPasswordInput] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxOpened, { open: openLightbox, close: closeLightbox }] =
    useDisclosure(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

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
      notifications.show({ message: err.code === "functions/internal" ? "Unable to open this gallery. Please try again." : err.message, color: "red" });
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = useCallback(async (photo) => {
    await downloadSinglePhoto(photo);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    setDownloadingAll(true);
    try {
      await downloadAllPhotosAsZip(gallery.name, gallery.photos);
    } finally {
      setDownloadingAll(false);
    }
  }, [gallery]);

  const handleOpenLightbox = (photo, index) => {
    setLightboxPhoto(photo);
    setLightboxIndex(index);
    openLightbox();
  };

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

  const photos = gallery?.photos || [];

  const prevPhoto = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev !== null && prev > 0) {
        const i = prev - 1;
        setLightboxPhoto(photos[i]);
        return i;
      }
      return prev;
    });
  }, [photos]);

  const nextPhoto = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev !== null && prev < photos.length - 1) {
        const i = prev + 1;
        setLightboxPhoto(photos[i]);
        return i;
      }
      return prev;
    });
  }, [photos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpened) return;
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpened, prevPhoto, nextPhoto]);

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextPhoto();
    else if (distance < -50) prevPhoto();
    setTouchStart(null);
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
    <Box style={{ background: bg, minHeight: "100vh" }}>
      {isAdmin && gallery.needsMigration && <Text c="red" ta="center" p="md">These photos need a privacy migration before clients can open the gallery.</Text>}
      {/* Cover */}
      <GalleryCover gallery={gallery} isAdmin={isAdmin} />

      {/* Photo count */}
      <Box ta="center" py="sm">
        <Text
          size="xs"
          c="dimmed"
          tt="uppercase"
          style={{ letterSpacing: "0.1em" }}
        >
          {photos.length} photos
        </Text>
      </Box>

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
            isDownloadingAll={downloadingAll}
            onOpenLightbox={handleOpenLightbox}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
            onDelete={handleDeletePhoto}
            onSetCover={handleSetCover}
          />
        )}
      </Box>

      {/* Lightbox */}
      <Modal
        opened={lightboxOpened}
        onClose={closeLightbox}
        size="auto"
        centered
        withCloseButton
        padding="md"
        radius={0}
        styles={{
          content: { background: "rgba(0,0,0,0.95)", maxWidth: "90vw" },
          header: { background: "transparent" },
          close: { color: "var(--mantine-color-gray-5)" },
        }}
      >
        {lightboxPhoto && (
          <Stack
            align="center"
            gap="md"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={lightboxPhoto.url}
              alt=""
              mah="72vh"
              fit="contain"
              radius={0}
            />
            <Group gap="sm">
              <Button
                variant="outline"
                color="gray"
                radius={0}
                size="sm"
                disabled={lightboxIndex === 0}
                onClick={prevPhoto}
              >
                ‹ Prev
              </Button>
              <Button
                color="yellow.6"
                c="dark.9"
                radius={0}
                size="sm"
                onClick={() => handleDownload(lightboxPhoto)}
              >
                ↓ Download
              </Button>
              <Button
                variant="outline"
                color="gray"
                radius={0}
                size="sm"
                disabled={lightboxIndex === photos.length - 1}
                onClick={nextPhoto}
              >
                Next ›
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
