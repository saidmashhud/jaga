import {
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from '../../utils/cx';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** Tooltip body. Tooltip must never be the only source of the information. */
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Show delay in ms. */
  delay?: number;
  /** Single focusable child element — receives aria-describedby. */
  children: ReactElement;
  disabled?: boolean;
}

export function Tooltip({
  content,
  placement = 'top',
  delay = 300,
  children,
  disabled = false,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);

  if (!isValidElement(children)) return children;

  const child = cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-describedby': open ? id : undefined,
  });

  return (
    <span
      className={styles.anchor}
      onMouseEnter={disabled ? undefined : show}
      onMouseLeave={hide}
      onFocus={disabled ? undefined : show}
      onBlur={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide();
      }}
    >
      {child}
      {open && !disabled && (
        <span role="tooltip" id={id} className={cx(styles.tooltip, styles[placement])}>
          {content}
        </span>
      )}
    </span>
  );
}
