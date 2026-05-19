export default function GridThumb({ type, active }) {
  const c = active ? "#1a1a1a" : "#bbb";
  const thumbs = {
    masonry: (
      <svg width="38" height="26" viewBox="0 0 38 26">
        <rect x="0" y="0" width="10" height="18" rx="1" fill={c} />
        <rect
          x="14"
          y="0"
          width="10"
          height="10"
          rx="1"
          fill={c}
          opacity=".7"
        />
        <rect
          x="28"
          y="0"
          width="10"
          height="14"
          rx="1"
          fill={c}
          opacity=".7"
        />
        <rect
          x="14"
          y="13"
          width="10"
          height="13"
          rx="1"
          fill={c}
          opacity=".4"
        />
        <rect
          x="28"
          y="17"
          width="10"
          height="9"
          rx="1"
          fill={c}
          opacity=".4"
        />
        <rect x="0" y="21" width="10" height="5" rx="1" fill={c} opacity=".4" />
      </svg>
    ),
    grid: (
      <svg width="38" height="26" viewBox="0 0 38 26">
        {[0, 14, 28].flatMap((x) =>
          [0, 14].map((y) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="11"
              height="11"
              rx="1"
              fill={c}
              opacity={x === 0 && y === 0 ? 1 : 0.45}
            />
          )),
        )}
      </svg>
    ),
    rows: (
      <svg width="38" height="26" viewBox="0 0 38 26">
        <rect x="0" y="0" width="38" height="7" rx="1" fill={c} />
        <rect x="0" y="9" width="38" height="7" rx="1" fill={c} opacity=".6" />
        <rect
          x="0"
          y="18"
          width="38"
          height="7"
          rx="1"
          fill={c}
          opacity=".35"
        />
      </svg>
    ),
    compact: (
      <svg width="38" height="26" viewBox="0 0 38 26">
        {[0, 8, 16, 24, 32].map((x, i) => (
          <rect
            key={x}
            x={x}
            y="0"
            width="6"
            height="26"
            rx="1"
            fill={c}
            opacity={i === 0 ? 1 : 0.4}
          />
        ))}
      </svg>
    ),
  };
  return thumbs[type] || null;
}
