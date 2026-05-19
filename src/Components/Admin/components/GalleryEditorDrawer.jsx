import { useEffect, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  ScrollArea,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconX,
  IconDeviceDesktop,
  IconDeviceTablet,
  IconCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { updateGallery } from "../../../Hooks/useGallery.js";
import { EDITOR_TABS, FONT_OPTIONS } from "../constants";
import { loadGoogleFont } from "../utils";
import LivePreview from "./LivePreview";
import CoverPanel from "./CoverPanel";
import TypographyPanel from "./TypographyPanel";
import GridPanel from "./GridPanel";

export default function GalleryEditorDrawer({ gallery, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState("cover");
  const [viewport, setViewport] = useState("desktop");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    coverStyle: "fullbleed",
    coverHeight: "medium",
    coverPhotoId: null,
    overlayOpacity: 0.45,
    titleFont: "Cormorant Garamond",
    titleSize: "lg",
    titleWeight: "300",
    titleSpacing: 0.05,
    layout: "masonry",
    gridGap: "sm",
    gridCols: 3,
  });

  useEffect(() => {
    if (!gallery) return;
    setConfig({
      coverStyle: gallery.coverStyle || "fullbleed",
      coverHeight: gallery.coverHeight || "medium",
      coverPhotoId: gallery.coverPhotoId || null,
      overlayOpacity: gallery.overlayOpacity ?? 0.45,
      titleFont: gallery.titleFont || "Cormorant Garamond",
      titleSize: gallery.titleSize || "lg",
      titleWeight: gallery.titleWeight || "300",
      titleSpacing: gallery.titleSpacing ?? 0.05,
      layout: gallery.layout || "masonry",
      gridGap: gallery.gridGap || "sm",
      gridCols: gallery.gridCols || 3,
    });
  }, [gallery]);

  useEffect(() => {
    FONT_OPTIONS.forEach((f) => loadGoogleFont(f.value));
  }, []);

  const handleChange = (updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGallery(gallery.slug, config);
      setSaved(true);
      notifications.show({
        message: "Gallery design saved!",
        color: "green",
        icon: <IconCheck size={14} />,
      });
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      notifications.show({
        message: `Save failed: ${err.message}`,
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const panelProps = {
    config,
    onChange: handleChange,
    photos: gallery?.photos || [],
  };

  return (
    <Box
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        background: "#f7f7f6",
        fontFamily: "DM Sans, system-ui, sans-serif",
        paddingTop: "100px",
      }}
    >
      <Box
        style={{
          height: 52,
          background: "white",
          borderBottom: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <ActionIcon variant="subtle" color="gray" onClick={onClose} size="sm">
          <IconChevronLeft size={16} />
        </ActionIcon>
        <Text size="xs" c="dimmed">
          Admin
        </Text>
        <Text size="xs" c="dimmed">
          /
        </Text>
        <Text size="sm" fw={500}>
          {gallery?.name}
        </Text>

        <Box style={{ flex: 1 }} />

        <Group gap={4}>
          <Tooltip label="Desktop">
            <ActionIcon
              size="sm"
              variant={viewport === "desktop" ? "filled" : "subtle"}
              color={viewport === "desktop" ? "dark" : "gray"}
              onClick={() => setViewport("desktop")}
            >
              <IconDeviceDesktop size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Mobile">
            <ActionIcon
              size="sm"
              variant={viewport === "mobile" ? "filled" : "subtle"}
              color={viewport === "mobile" ? "dark" : "gray"}
              onClick={() => setViewport("mobile")}
            >
              <IconDeviceTablet size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Button
          size="xs"
          color={saved ? "green" : "dark"}
          radius="md"
          onClick={handleSave}
          loading={saving}
          leftSection={saved ? <IconCheck size={12} /> : null}
          style={{ minWidth: 100 }}
        >
          {saved ? "Saved" : "Save"}
        </Button>

        <ActionIcon variant="subtle" color="gray" onClick={onClose} size="sm">
          <IconX size={16} />
        </ActionIcon>
      </Box>

      <Box style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Box
          style={{
            width: 52,
            background: "#1c1c1c",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 16,
            gap: 4,
            flexShrink: 0,
          }}
        >
          {EDITOR_TABS.map(({ id, label, icon: Icon }) => (
            <Tooltip key={id} label={label} position="right" withArrow>
              <ActionIcon
                size="xl"
                variant="transparent"
                onClick={() => setActiveTab(id)}
                style={{
                  borderRadius: 8,
                  background:
                    activeTab === id ? "rgba(255,255,255,0.12)" : "transparent",
                  color: activeTab === id ? "white" : "#777",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={18} />
              </ActionIcon>
            </Tooltip>
          ))}
        </Box>

        <Box
          style={{
            width: 268,
            background: "white",
            borderRight: "1px solid #ebebeb",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <Box
            style={{
              padding: "14px 16px 10px",
              borderBottom: "1px solid #f2f2f2",
            }}
          >
            <Text fw={600} size="sm">
              {EDITOR_TABS.find((t) => t.id === activeTab)?.label}
            </Text>
          </Box>
          <ScrollArea style={{ flex: 1 }}>
            <Box p="md">
              {activeTab === "cover" && <CoverPanel {...panelProps} />}
              {activeTab === "typography" && (
                <TypographyPanel {...panelProps} />
              )}
              {activeTab === "grid" && <GridPanel {...panelProps} />}
            </Box>
          </ScrollArea>
        </Box>

        <Box
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 28,
            overflow: "hidden",
          }}
        >
          <Box
            style={{
              width: viewport === "desktop" ? "100%" : 400,
              maxWidth: viewport === "desktop" ? "100%" : 400,
              height: "100%",
              borderRadius: 8,
              boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
              overflow: "hidden",
              transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <LivePreview
              gallery={gallery}
              config={config}
              viewport={viewport}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
