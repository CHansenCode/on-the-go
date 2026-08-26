// A small, hand-drawn icon set — plain line art, one color per icon (no
// icon-font glyphs, no built-in multi-tone rendering). Every icon takes
// just `size` and `color` so callers stay in full control of both.

import { Circle, Line, Path, Rect, Svg } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color: string;
};

const STROKE_WIDTH = 1.8;

export function BackIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
}

export function ShareIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V4M8 8l4-4 4 4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SchoolIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6c-1.8-1.3-4.2-1.3-6 0v12c1.8-1.3 4.2-1.3 6 0V6z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6c1.8-1.3 4.2-1.3 6 0v12c-1.8-1.3-4.2-1.3-6 0V6z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MicIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth={STROKE_WIDTH} />
      <Path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <Line x1="12" y1="18" x2="12" y2="21" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
}

export function ChartIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1="18" y1="20" x2="18" y2="4" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Circle cx="9" cy="6" r="2" stroke={color} strokeWidth={STROKE_WIDTH} />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Circle cx="16" cy="12" r="2" stroke={color} strokeWidth={STROKE_WIDTH} />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Circle cx="11" cy="18" r="2" stroke={color} strokeWidth={STROKE_WIDTH} />
    </Svg>
  );
}

export function FolderIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AddIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function PlayIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5v14l11-7z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="5" width="3.5" height="14" rx="1" fill={color} />
      <Rect x="13.5" y="5" width="3.5" height="14" rx="1" fill={color} />
    </Svg>
  );
}

export function StopIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="7" width="10" height="10" rx="2" fill={color} />
    </Svg>
  );
}
