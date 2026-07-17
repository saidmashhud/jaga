import { useState, type HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './Avatar.module.css';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Full name; initials are derived when no image is available. */
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Shows the online indicator dot. */
  online?: boolean;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function Avatar({
  src,
  name,
  size = 'md',
  online = false,
  className,
  ...rest
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;
  const initials = name ? initialsOf(name) : null;

  return (
    <span
      className={cx(styles.root, styles[size], className)}
      role="img"
      aria-label={name ?? 'Пользователь'}
      {...rest}
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : initials ? (
        <span className={styles.initials} aria-hidden="true">
          {initials}
        </span>
      ) : (
        <svg
          className={styles.placeholder}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
      )}
      {online && <span className={styles.online} aria-hidden="true" />}
    </span>
  );
}
