import {
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { GRID_STYLES } from "../constants";
import GridThumb from "./GridThumb";

export default function GridPanel({ config, onChange }) {
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
          Layout
        </Text>
        <SimpleGrid cols={2} spacing={6}>
          {GRID_STYLES.map((s) => (
            <UnstyledButton
              key={s.value}
              onClick={() => onChange({ layout: s.value })}
              style={{
                border: `2px solid ${config.layout === s.value ? "#1a1a1a" : "#e4e4e4"}`,
                borderRadius: 6,
                padding: "12px 10px",
                background: config.layout === s.value ? "#f5f5f5" : "white",
                textAlign: "center",
              }}
            >
              <GridThumb type={s.value} active={config.layout === s.value} />
              <Text size="xs" fw={config.layout === s.value ? 600 : 400} mt={6}>
                {s.label}
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
          Gap
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={config.gridGap || "sm"}
          onChange={(v) => onChange({ gridGap: v })}
          data={[
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
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
          Columns
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={String(config.gridCols || 3)}
          onChange={(v) => onChange({ gridCols: Number(v) })}
          data={["2", "3", "4", "5"]}
        />
      </div>
    </Stack>
  );
}
