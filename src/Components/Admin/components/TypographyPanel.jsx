import { useEffect } from "react";
import {
  Badge,
  Divider,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { FONT_OPTIONS } from "../constants";
import { loadGoogleFont } from "../utils";

export default function TypographyPanel({ config, onChange }) {
  useEffect(() => {
    FONT_OPTIONS.forEach((f) => loadGoogleFont(f.value));
  }, []);

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
          Title Font
        </Text>
        <Stack gap={6}>
          {FONT_OPTIONS.map((f) => (
            <UnstyledButton
              key={f.value}
              onClick={() => onChange({ titleFont: f.value })}
              style={{
                padding: "10px 14px",
                border: `2px solid ${config.titleFont === f.value ? "#1a1a1a" : "#e4e4e4"}`,
                borderRadius: 6,
                background: config.titleFont === f.value ? "#f5f5f5" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontFamily: f.value,
                  fontSize: 18,
                  lineHeight: 1,
                  color: "#1a1a1a",
                }}
              >
                {f.label}
              </Text>
              <Badge
                size="xs"
                variant="light"
                color="gray"
                style={{ flexShrink: 0 }}
              >
                {f.category}
              </Badge>
            </UnstyledButton>
          ))}
        </Stack>
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
          Size
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={config.titleSize || "lg"}
          onChange={(v) => onChange({ titleSize: v })}
          data={[
            { label: "S", value: "sm" },
            { label: "M", value: "lg" },
            { label: "L", value: "xl" },
            { label: "XL", value: "xxl" },
          ]}
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
          Weight
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={config.titleWeight || "300"}
          onChange={(v) => onChange({ titleWeight: v })}
          data={[
            { label: "Thin", value: "300" },
            { label: "Normal", value: "400" },
            { label: "Medium", value: "500" },
            { label: "Bold", value: "600" },
          ]}
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
          Letter Spacing
        </Text>
        <Slider
          min={0}
          max={0.3}
          step={0.01}
          value={config.titleSpacing ?? 0.05}
          onChange={(v) => onChange({ titleSpacing: v })}
          label={(v) => `${v.toFixed(2)}em`}
          size="sm"
        />
      </div>
    </Stack>
  );
}
