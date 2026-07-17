import { forwardRef, type FormEvent, type InputHTMLAttributes } from 'react';
import { AiIcon, MicIcon, SearchIcon } from '@cortex/icons';
import { cx } from '../../utils/cx';
import { IconButton } from '../IconButton/IconButton';
import { ProgressRing } from '../ProgressRing/ProgressRing';
import styles from './SearchCommandField.module.css';

export interface SearchCommandFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onSubmit'> {
  /** AI is processing the query. */
  loading?: boolean;
  /** Voice input is active. */
  listening?: boolean;
  /** AI mode toggle state. */
  aiActive?: boolean;
  onVoiceToggle?: () => void;
  onAiToggle?: () => void;
  onSubmit?: (value: string) => void;
}

export const SearchCommandField = forwardRef<HTMLInputElement, SearchCommandFieldProps>(
  function SearchCommandField(
    {
      loading = false,
      listening = false,
      aiActive = false,
      onVoiceToggle,
      onAiToggle,
      onSubmit,
      className,
      placeholder = 'Что важно сейчас?',
      value,
      ...rest
    },
    ref,
  ) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit?.(String(value ?? ''));
    };

    return (
      <form
        role="search"
        className={cx(styles.root, listening && styles.listening, className)}
        onSubmit={handleSubmit}
      >
        <span className={styles.searchIcon}>
          {loading ? (
            <ProgressRing size={18} thickness={2} aria-label="Обработка запроса" />
          ) : (
            <SearchIcon size={18} />
          )}
        </span>
        <input
          ref={ref}
          type="search"
          className={styles.input}
          placeholder={listening ? 'Слушаю…' : placeholder}
          aria-label={placeholder}
          value={value}
          {...rest}
        />
        {listening && (
          <span className={styles.wave} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
        <span className={styles.actions}>
          <IconButton
            aria-label={listening ? 'Остановить голосовой ввод' : 'Голосовой ввод'}
            size="sm"
            active={listening}
            onClick={onVoiceToggle}
          >
            <MicIcon size={16} />
          </IconButton>
          <IconButton
            aria-label="AI-режим"
            size="sm"
            variant="ai"
            active={aiActive}
            onClick={onAiToggle}
          >
            <AiIcon size={16} />
          </IconButton>
        </span>
      </form>
    );
  },
);
