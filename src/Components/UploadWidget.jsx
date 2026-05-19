// src/components/UploadWidget.jsx
import { useEffect, useRef, useState } from "react";
import { addPhotosToGallery } from "../Hooks/useGallery.js";
import { Button, Group, Text, Badge } from "@mantine/core";
import { IconUpload, IconCheck } from "@tabler/icons-react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function UploadWidget({ gallerySlug }) {
  const widgetRef = useRef(null);
  const [status, setStatus] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const pendingPhotos = useRef([]);

  useEffect(() => {
    if (!window.cloudinary) {
      const script = document.createElement("script");
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const openWidget = () => {
    if (!window.cloudinary) {
      setStatus("Cloudinary widget not loaded yet. Try again in a moment.");
      return;
    }

    pendingPhotos.current = [];
    setUploadedCount(0);
    setStatus("");

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        folder: `galleries/${gallerySlug}`,
        multiple: true,
        sources: ["local", "url", "camera"],
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic"],
        maxFileSize: 30_000_000,
        showAdvancedOptions: false,
        cropping: false,
        styles: {
          palette: {
            window: "#1A1B1E",
            windowBorder: "#2C2E33",
            tabIcon: "#339AF0",
            menuIcons: "#909296",
            textDark: "#C1C2C5",
            textLight: "#C1C2C5",
            link: "#339AF0",
            action: "#339AF0",
            inactiveTabIcon: "#5C5F66",
            error: "#FA5252",
            inProgress: "#339AF0",
            complete: "#40C057",
            sourceBg: "#25262B",
          },
        },
      },
      async (error, result) => {
        if (error) {
          setStatus(`Upload error: ${error.message}`);
          return;
        }

        if (result.event === "success") {
          const info = result.info;
          const thumbnailUrl = info.secure_url.replace(
            "/upload/",
            "/upload/w_600,q_auto,f_auto/",
          );
          pendingPhotos.current.push({
            publicId: info.public_id,
            url: info.secure_url,
            thumbnailUrl,
            filename: info.original_filename + "." + info.format,
            width: info.width,
            height: info.height,
            uploadedAt: new Date().toISOString(),
          });
          setUploadedCount((c) => c + 1);
        }

        if (result.event === "queues-end" && pendingPhotos.current.length > 0) {
          setSaving(true);
          setStatus("Saving to gallery…");
          try {
            await addPhotosToGallery(gallerySlug, pendingPhotos.current);
            setStatus(`✓ ${pendingPhotos.current.length} photo(s) added.`);
            pendingPhotos.current = [];
            setUploadedCount(0);
          } catch (err) {
            setStatus(`Error saving: ${err.message}`);
          } finally {
            setSaving(false);
          }
        }
      },
    );

    widgetRef.current.open();
  };

  return (
    <Group gap="sm" align="center" wrap="wrap" py={100}>
      <Button
        leftSection={<IconUpload size={15} />}
        onClick={openWidget}
        loading={saving}
        size="sm"
        radius="md"
        variant="filled"
      >
        Upload Photos
      </Button>

      {uploadedCount > 0 && (
        <Badge color="blue" variant="light">
          {uploadedCount} uploaded
        </Badge>
      )}

      {status && (
        <Text
          size="xs"
          c={
            status.startsWith("✓")
              ? "green"
              : status.startsWith("Error")
                ? "red"
                : "dimmed"
          }
        >
          {status}
        </Text>
      )}
    </Group>
  );
}
