import {
  Box,
  Divider,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
  Slider,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { SegmentedControl } from "@mantine/core";
import { COVER_STYLES } from "../constants";

export default function CoverPanel({ config, onChange, photos }) {
  return (
    <Stack gap="lg">
      <div>
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          c="dimmed"
          mb="xs"
          style={{ letterSpacing: "0.08em" }}
        >
          Style
        </Text>
        <SimpleGrid cols={2} spacing={6}>
          {COVER_STYLES.map((s) => (
            <UnstyledButton
              key={s.value}
              onClick={() => onChange({ coverStyle: s.value })}
              style={{
                border: `2px solid ${config.coverStyle === s.value ? "#1a1a1a" : "#e4e4e4"}`,
                borderRadius: 6,
                padding: "8px 10px",
                background: config.coverStyle === s.value ? "#f5f5f5" : "white",
                transition: "border-color 0.15s",
              }}
            >
              <Text size="xs" fw={config.coverStyle === s.value ? 600 : 400}>
                {s.label}
              </Text>
              <Text
                size="xs"
                c="dimmed"
                mt={2}
                style={{ lineHeight: 1.3, fontSize: 10 }}
              >
                {s.desc}
              </Text>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      </div>

      <div>
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          c="dimmed"
          mb="xs"
          style={{ letterSpacing: "0.08em" }}
        >
          Height
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={config.coverHeight || "medium"}
          onChange={(v) => onChange({ coverHeight: v })}
          data={["short", "medium", "tall", "fullscreen"]}
        />
      </div>

      <div>
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          c="dimmed"
          mb="xs"
          style={{ letterSpacing: "0.08em" }}
        >
          Overlay Darkness
        </Text>
        <Slider
          min={0}
          max={0.85}
          step={0.05}
          value={config.overlayOpacity ?? 0.45}
          onChange={(v) => onChange({ overlayOpacity: v })}
          label={(v) => `${Math.round(v * 100)}%`}
          size="sm"
        />
      </div>

      <Divider />

      <div>
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          c="dimmed"
          mb="xs"
          style={{ letterSpacing: "0.08em" }}
        >
          Cover Photo
        </Text>
        {photos.length === 0 ? (
          <Text size="xs" c="dimmed">
            Upload photos first.
          </Text>
        ) : (
          <ScrollArea h={200}>
            <SimpleGrid cols={3} spacing={5}>
              {photos.map((p) => (
                <UnstyledButton
                  key={p.publicId}
                  onClick={() => onChange({ coverPhotoId: p.publicId })}
                  style={{
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={p.thumbnailUrl || p.url}
                    alt=""
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      objectFit: "cover",
                      display: "block",
                      opacity: config.coverPhotoId === p.publicId ? 1 : 0.6,
                    }}
                  />
                  {config.coverPhotoId === p.publicId && (
                    <Box
                      style={{
                        position: "absolute",
                        inset: 0,
                        border: "2px solid #1a1a1a",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.2)",
                      }}
                    >
                      <IconCheck size={14} color="white" />
                    </Box>
                  )}
                </UnstyledButton>
              ))}
            </SimpleGrid>
          </ScrollArea>
        )}
      </div>
    </Stack>
  );
}
