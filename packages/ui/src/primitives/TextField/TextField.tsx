import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './TextField.module.css';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  /** Error message; switches the field to the error state. */
  error?: string;
  /** Helper text below the field (hidden while an error is shown). */
  hint?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, error, hint, iconLeft, iconRight, className, id: idProp, disabled, ...rest },
    ref,
  ) {
    const autoId = useId();
    const id = idProp ?? autoId;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className={cx(styles.root, disabled && styles.disabled, className)}>
        {label && (
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
        )}
        <div className={cx(styles.field, error && styles.error)}>
          {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
          <input
            ref={ref}
            id={id}
            className={styles.input}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...rest}
          />
          {iconRight && <span className={styles.icon}>{iconRight}</span>}
        </div>
        {error ? (
          <span id={`${id}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={`${id}-hint`} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
