import {
  ArrowUpDown,
  BadgeCheck,
  Calculator,
  CalendarClock,
  CalendarDays,
  Eraser,
  Filter,
  Fingerprint,
  GitBranch,
  Hash,
  Palette,
  Search,
  ShieldAlert,
  Sigma,
  Table2,
  Type,
  type LucideProps,
} from "lucide-react";

/** Map of skill icon names (stored in content JSON) to lucide components. */
const ICONS = {
  GitBranch,
  Sigma,
  Hash,
  Search,
  ShieldAlert,
  Eraser,
  Type,
  Table2,
  Palette,
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  Filter,
  ArrowUpDown,
  Fingerprint,
} as const;

export function SkillIcon({
  name,
  ...props
}: { name?: string } & LucideProps) {
  const Icon = (name && ICONS[name as keyof typeof ICONS]) || Calculator;
  return <Icon {...props} />;
}
