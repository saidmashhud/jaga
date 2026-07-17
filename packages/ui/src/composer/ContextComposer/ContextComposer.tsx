import { useRef, type FormEvent, type HTMLAttributes } from 'react';
import { MicIcon, PlusIcon, SendIcon } from '@cortex/icons';
import { cx } from '../../utils/cx';
import { IconButton } from '../../primitives/IconButton/IconButton';
import { ProgressRing } from '../../primitives/ProgressRing/ProgressRing';
import styles from './ContextComposer.module.css';

export interface ContextComposerProps
  extends Omit<HTMLAttributes<HTMLFormElement>, 'onChange' | 'onSubmit'> {
  value: string;
  onChange: (value: string) => void;
  /** Submit via Enter or the send button. */
  onSubmit?: (value: string) => void;
  /** Mock AI processing after submit. */
  processing?: boolean;
  /** Voice input active. */
  listening?: boolean;
  onVoiceToggle?: () => void;
  onAddClick?: () => void;
  placeholder?: string;
}

/** Bottom context input row: add, type, dictate, send. */
export function ContextComposer({
  value,
  onChange,
  onSubmit,
  processing = false,
  listening = false,
  onVoiceToggle,
  onAddClick,
  placeholder = 'Добавить мысль, задачу, решение или событие…',
  className,
  ...rest
}: ContextComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 && !processing;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;
    onSubmit?.(value.trim());
    inputRef.current?.focus();
  };

  return (
    <form
      className={cx(
        styles.root,
        listening && styles.listening,
        processing && styles.processing,
        className,
      )}
      onSubmit={handleSubmit}
      {...rest}
    >
      <IconButton
        aria-label="Добавить вложение"
        size="md"
        onClick={onAddClick}
        disabled={processing}
      >
        <PlusIcon size={18} />
      </IconButton>
      <input
        ref={inputRef}
        className={styles.input}
        value={value}
        placeholder={listening ? 'Слушаю…' : placeholder}
        aria-label="Контекст"
        disabled={processing}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && canSend) {
            event.preventDefault();
            onSubmit?.(value.trim());
          }
        }}
      />
      {listening && (
        <span className={styles.wave} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      <IconButton
        aria-label={listening ? 'Остановить голосовой ввод' : 'Голосовой ввод'}
        size="md"
        active={listening}
        onClick={onVoiceToggle}
        disabled={processing}
      >
        <MicIcon size={18} />
      </IconButton>
      <button
        type="submit"
        className={styles.send}
        disabled={!canSend}
        aria-label="Отправить"
      >
        {processing ? (
          <ProgressRing size={18} thickness={2} color="#fff" aria-label="Обработка" />
        ) : (
          <SendIcon size={17} />
        )}
      </button>
    </form>
  );
}
