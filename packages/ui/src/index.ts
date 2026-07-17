/* primitives */
export { Text, type TextProps, type TextColor } from './primitives/Text/Text';
export { Surface, type SurfaceProps } from './primitives/Surface/Surface';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './primitives/Button/Button';
export { IconButton, type IconButtonProps } from './primitives/IconButton/IconButton';
export { Badge, type BadgeProps, type BadgeVariant } from './primitives/Badge/Badge';
export { StatusDot, type StatusDotProps } from './primitives/StatusDot/StatusDot';
export { Avatar, type AvatarProps } from './primitives/Avatar/Avatar';
export { Tooltip, type TooltipProps } from './primitives/Tooltip/Tooltip';
export { ProgressRing, type ProgressRingProps } from './primitives/ProgressRing/ProgressRing';
export { TextField, type TextFieldProps } from './primitives/TextField/TextField';
export {
  SearchCommandField,
  type SearchCommandFieldProps,
} from './primitives/SearchCommandField/SearchCommandField';
export { Divider, type DividerProps } from './primitives/Divider/Divider';

/* layout */
export { AppShell, type AppShellProps } from './layout/AppShell/AppShell';
export { Stack, type StackProps } from './layout/Stack/Stack';
export { Grid, type GridProps } from './layout/Grid/Grid';
export {
  ScrollableArea,
  type ScrollableAreaProps,
} from './layout/ScrollableArea/ScrollableArea';
export { Panel, type PanelProps } from './layout/Panel/Panel';

/* navigation */
export {
  NavigationRail,
  type NavigationRailProps,
} from './navigation/NavigationRail/NavigationRail';
export {
  NavigationRailItem,
  type NavigationRailItemProps,
} from './navigation/NavigationRailItem/NavigationRailItem';

/* orbit */
export { OrbitCanvas, type OrbitCanvasProps } from './orbit/OrbitCanvas/OrbitCanvas';
export {
  ProjectNode,
  type ProjectNodeProps,
  type ProjectStatus,
} from './orbit/ProjectNode/ProjectNode';
export { UserCoreNode, type UserCoreNodeProps } from './orbit/UserCoreNode/UserCoreNode';
export {
  OrbitConnection,
  connectionMidpoint,
  connectionControlPoint,
  connectionPointAt,
  type OrbitConnectionProps,
  type ScenePoint,
} from './orbit/OrbitConnection/OrbitConnection';
export {
  ConnectionLabel,
  type ConnectionLabelProps,
} from './orbit/ConnectionLabel/ConnectionLabel';
export { OrbitRing, type OrbitRingProps } from './orbit/OrbitRing/OrbitRing';
export { SceneGlow, type SceneGlowProps } from './orbit/SceneGlow/SceneGlow';

/* insights */
export { LensChip, type LensChipProps } from './insights/LensChip/LensChip';
export {
  FocusTaskCard,
  type FocusTaskCardProps,
} from './insights/FocusTaskCard/FocusTaskCard';
export { ActivityItem, type ActivityItemProps } from './insights/ActivityItem/ActivityItem';
export {
  RecommendationCard,
  type RecommendationCardProps,
} from './insights/RecommendationCard/RecommendationCard';

/* timeline */
export {
  Timeline,
  type TimelineProps,
  type TimelinePoint,
  type TimelinePeriod,
} from './timeline/Timeline/Timeline';
export {
  TimelineEvent,
  type TimelineEventProps,
} from './timeline/TimelineEvent/TimelineEvent';

/* composer */
export {
  ContextComposer,
  type ContextComposerProps,
} from './composer/ContextComposer/ContextComposer';

/* utils */
export { cx } from './utils/cx';
