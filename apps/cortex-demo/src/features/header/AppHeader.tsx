import { AiIcon, BellIcon, InsideIcon, OrbitIcon, SettingsIcon } from '@cortex/icons';
import { Avatar, Button, IconButton, SearchCommandField, Tooltip } from '@cortex/ui';
import { useCortex } from '../../state/CortexProvider';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const { state, dispatch } = useCortex();

  return (
    <div className={styles.root}>
      <div className={styles.logo}>
        <span className={styles.logoMark} aria-hidden="true">
          <OrbitIcon size={20} />
        </span>
        <span className={styles.logoText}>
          <span className={styles.logoName}>Cortex</span>
          <span className={styles.logoSub}>Attention OS</span>
        </span>
      </div>

      <div className={styles.search}>
        <SearchCommandField
          value={state.searchValue}
          onChange={(event) => dispatch({ type: 'set-search', value: event.target.value })}
          listening={state.searchListening}
          aiActive={state.aiMode}
          onVoiceToggle={() =>
            dispatch({ type: 'search-listening', value: !state.searchListening })
          }
          onAiToggle={() => dispatch({ type: 'toggle-ai-mode' })}
          onSubmit={() =>
            dispatch({
              type: 'show-toast',
              message: 'Поиск по контексту появится на следующем этапе.',
            })
          }
        />
      </div>

      <div className={styles.actions}>
        <Button
          variant="ai"
          size="md"
          className={styles.aiDirector}
          iconLeft={<AiIcon size={16} />}
          onClick={() =>
            dispatch({
              type: 'show-toast',
              message: 'AI Режиссёр — демо. Реальный сценарий появится позже.',
            })
          }
        >
          AI Режиссёр
        </Button>
        <Tooltip content="Уведомления" placement="bottom">
          <span className={styles.notifWrap}>
            <IconButton
              aria-label="Уведомления"
              onClick={() =>
                dispatch({ type: 'show-toast', message: '3 новых уведомления (демо).' })
              }
            >
              <BellIcon size={18} />
            </IconButton>
            <span className={styles.notifDot} aria-hidden="true" />
          </span>
        </Tooltip>
        <Tooltip content="Системные настройки" placement="bottom">
          <IconButton
            aria-label="Системные настройки"
            onClick={() =>
              dispatch({ type: 'show-toast', message: 'Настройки — демо-заглушка.' })
            }
          >
            <SettingsIcon size={18} />
          </IconButton>
        </Tooltip>
        <IconButton
          aria-label={state.asideOpen ? 'Скрыть панель инсайтов' : 'Показать панель инсайтов'}
          className={styles.panelToggle}
          active={state.asideOpen}
          onClick={() => dispatch({ type: 'set-aside-open', value: !state.asideOpen })}
        >
          <InsideIcon size={18} />
        </IconButton>
        <Avatar name="Саид Машхуд" online />
      </div>
    </div>
  );
}
