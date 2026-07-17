import { forwardRef, type ReactNode, type SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Icon box size in px (width = height). Defaults to 20. */
  size?: number | string;
  /** Accessible name. Omit for purely decorative usage (aria-hidden). */
  title?: string;
}

function createIcon(displayName: string, children: ReactNode) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 20, title, ...rest }, ref) => (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={title ? undefined : true}
        role={title ? 'img' : undefined}
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {children}
      </svg>
    ),
  );
  Icon.displayName = displayName;
  return Icon;
}

/* ------------------------------------------------------------------ modes */

export const OrbitIcon = createIcon(
  'OrbitIcon',
  <>
    <circle cx="12" cy="12" r="3.2" />
    <ellipse cx="12" cy="12" rx="9" ry="4.4" transform="rotate(-24 12 12)" />
    <circle cx="19.4" cy="8.6" r="1.1" fill="currentColor" stroke="none" />
  </>,
);

export const FocusIcon = createIcon(
  'FocusIcon',
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
  </>,
);

export const InsideIcon = createIcon(
  'InsideIcon',
  <>
    <path d="M12 3.5 20 8l-8 4.5L4 8l8-4.5z" />
    <path d="M4 12.5 12 17l8-4.5" />
    <path d="M4 17 12 21.5 20 17" opacity="0.55" />
  </>,
);

export const DecisionIcon = createIcon(
  'DecisionIcon',
  <>
    <path d="M12 4v5M12 9c0 3-6 3-6 7M12 9c0 3 6 3 6 7" />
    <circle cx="12" cy="4" r="1.6" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="18" cy="18" r="1.6" />
  </>,
);

export const SettingsIcon = createIcon(
  'SettingsIcon',
  <>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </>,
);

/* ---------------------------------------------------------------- actions */

export const MicIcon = createIcon(
  'MicIcon',
  <>
    <rect x="9.4" y="3.5" width="5.2" height="9.5" rx="2.6" />
    <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" />
  </>,
);

export const SendIcon = createIcon(
  'SendIcon',
  <path d="M4.5 12 20 4.8 16.2 19.5l-4.4-4.9-4.6 2.2L8 12.6l12-7.8" />,
);

export const BellIcon = createIcon(
  'BellIcon',
  <>
    <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2.5H4.5L6 16z" />
    <path d="M10.2 20.5a2 2 0 0 0 3.6 0" />
  </>,
);

export const AiIcon = createIcon(
  'AiIcon',
  <>
    <path d="M12 4.5 13.6 9.4 18.5 11 13.6 12.6 12 17.5 10.4 12.6 5.5 11 10.4 9.4 12 4.5z" />
    <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" opacity="0.7" />
  </>,
);

export const TimelineIcon = createIcon(
  'TimelineIcon',
  <>
    <path d="M3 12h18" />
    <circle cx="7" cy="12" r="1.8" />
    <circle cx="14" cy="12" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="19.5" cy="12" r="1.3" opacity="0.6" />
  </>,
);

export const PlusIcon = createIcon('PlusIcon', <path d="M12 5v14M5 12h14" />);

export const CheckIcon = createIcon('CheckIcon', <path d="m5 12.5 4.5 4.5L19 7" />);

export const CloseIcon = createIcon('CloseIcon', <path d="M6 6l12 12M18 6 6 18" />);

export const SearchIcon = createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="6" />
    <path d="m15.5 15.5 4.5 4.5" />
  </>,
);

export const ChevronDownIcon = createIcon('ChevronDownIcon', <path d="m6 9.5 6 6 6-6" />);

export const ChevronRightIcon = createIcon('ChevronRightIcon', <path d="m9.5 6 6 6-6 6" />);

export const ClockIcon = createIcon(
  'ClockIcon',
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 2" />
  </>,
);

/* ----------------------------------------------------------- state marks */

export const RiskIcon = createIcon(
  'RiskIcon',
  <>
    <path d="M12 4 21 19.5H3L12 4z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17" r="0.4" fill="currentColor" stroke="none" />
  </>,
);

export const PauseIcon = createIcon(
  'PauseIcon',
  <path d="M9 5.5v13M15 5.5v13" />,
);

/* ------------------------------------------------------- project types */

export const ProjectIcon = createIcon(
  'ProjectIcon',
  <path d="M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6L12 3.2z" />,
);

export const NetworkIcon = createIcon(
  'NetworkIcon',
  <>
    <circle cx="12" cy="6" r="2.2" />
    <circle cx="5.5" cy="17" r="2.2" />
    <circle cx="18.5" cy="17" r="2.2" />
    <path d="M10.9 7.9 6.6 15.1M13.1 7.9l4.3 7.2M7.7 17h8.6" />
  </>,
);

export const FlameIcon = createIcon(
  'FlameIcon',
  <path d="M12 3.5c1.2 2.8 4.8 4.4 4.8 8.7a4.8 4.8 0 0 1-9.6 0c0-1.9.9-3.3 1.9-4.3.3 1 .9 1.7 1.9 2-.5-2 0-4.4 1-6.4z" />,
);

export const CarIcon = createIcon(
  'CarIcon',
  <>
    <path d="m5 13 1.3-4a2 2 0 0 1 1.9-1.4h7.6a2 2 0 0 1 1.9 1.4L19 13" />
    <path d="M4 13h16v4h-1.5M4 13v4h1.5" />
    <circle cx="7.8" cy="17" r="1.8" />
    <circle cx="16.2" cy="17" r="1.8" />
  </>,
);

export const CoffeeIcon = createIcon(
  'CoffeeIcon',
  <>
    <path d="M5 10h10v4.5a4.5 4.5 0 0 1-4.5 4.5h-1A4.5 4.5 0 0 1 5 14.5V10z" />
    <path d="M15 11h1.5a2.5 2.5 0 0 1 0 5H15" />
    <path d="M8 6.5V5M11.5 6.5v-2" opacity="0.7" />
  </>,
);

export const CodeIcon = createIcon(
  'CodeIcon',
  <path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5M13 5l-2.5 14" />,
);

export const TagIcon = createIcon(
  'TagIcon',
  <>
    <path d="M4 4h7.2a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-5.2 5.2a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 4 11.2V4z" />
    <circle cx="8.5" cy="8.5" r="1.4" />
  </>,
);

/** Registry for icon galleries and mock data that references icons by id. */
export const iconRegistry = {
  orbit: OrbitIcon,
  focus: FocusIcon,
  inside: InsideIcon,
  decision: DecisionIcon,
  settings: SettingsIcon,
  mic: MicIcon,
  send: SendIcon,
  bell: BellIcon,
  ai: AiIcon,
  timeline: TimelineIcon,
  plus: PlusIcon,
  check: CheckIcon,
  close: CloseIcon,
  search: SearchIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-right': ChevronRightIcon,
  clock: ClockIcon,
  risk: RiskIcon,
  pause: PauseIcon,
  project: ProjectIcon,
  network: NetworkIcon,
  flame: FlameIcon,
  car: CarIcon,
  coffee: CoffeeIcon,
  code: CodeIcon,
  tag: TagIcon,
} as const;

export type IconName = keyof typeof iconRegistry;
