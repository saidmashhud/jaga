import { useEffect } from 'react';
import {
  DecisionIcon,
  FocusIcon,
  InsideIcon,
  OrbitIcon,
  SettingsIcon,
} from '@cortex/icons';
import { AppShell, NavigationRail, NavigationRailItem } from '@cortex/ui';
import { AppHeader } from '../../features/header/AppHeader';
import { ComposerBar } from '../../features/composer/ComposerBar';
import { InsightsPanel } from '../../features/insights/InsightsPanel';
import { OrbitScene } from '../../features/orbit/OrbitScene';
import { TimelineBar } from '../../features/timeline/TimelineBar';
import { Toast } from '../../features/toast/Toast';
import { useCortex } from '../../state/CortexProvider';
import type { NavigationMode } from '../../state/cortex-state';

const navItems: Array<{
  mode: NavigationMode;
  label: string;
  icon: JSX.Element;
  badge?: string;
}> = [
  { mode: 'orbit', label: 'Orbit', icon: <OrbitIcon size={20} /> },
  { mode: 'focus', label: 'Focus', icon: <FocusIcon size={20} /> },
  { mode: 'inside', label: 'Inside', icon: <InsideIcon size={20} /> },
  { mode: 'decision', label: 'Decision', icon: <DecisionIcon size={20} />, badge: '1' },
  { mode: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
];

export function OrbitPage() {
  const { state, dispatch, setNavigationMode } = useCortex();

  // Global Escape: close the overlay panel first, then clear scene selection.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (state.asideOpen) {
        dispatch({ type: 'set-aside-open', value: false });
      } else {
        dispatch({ type: 'clear-selection' });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [state.asideOpen, dispatch]);

  return (
    <>
      <AppShell
        header={<AppHeader />}
        navigation={
          <NavigationRail>
            {navItems.map((item) => (
              <NavigationRailItem
                key={item.mode}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                active={state.navigationMode === item.mode}
                onClick={() => setNavigationMode(item.mode)}
              />
            ))}
          </NavigationRail>
        }
        aside={<InsightsPanel />}
        asideOpen={state.asideOpen}
        onAsideClose={() => dispatch({ type: 'set-aside-open', value: false })}
        composer={<ComposerBar />}
      >
        <OrbitScene />
        <TimelineBar />
      </AppShell>
      <Toast />
    </>
  );
}
