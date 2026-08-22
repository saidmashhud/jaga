import { ContextComposer } from '@cortex/ui';
import { useCortex } from '../../state/CortexProvider';
import { LooseNotes } from './LooseNotes';

export function ComposerBar() {
  const { state, dispatch, submitComposer } = useCortex();

  return (
    <>
      {/* Записи, до которых не дошли руки — ни ваши, ни модели. Стоят над
          полем: там же, где человек их писал, и оттуда же до них можно
          дотянуться. */}
      <LooseNotes
        version={state.addedActivities.length + (state.composerProcessing ? 1 : 0)}
        onChange={() => window.location.reload()}
      />
      <ContextComposer
        value={state.composerDraft}
        onChange={(value) => dispatch({ type: 'set-draft', value })}
        onSubmit={submitComposer}
        processing={state.composerProcessing}
        listening={state.composerListening}
        onVoiceToggle={() =>
          dispatch({ type: 'composer-listening', value: !state.composerListening })
        }
        onAddClick={() =>
          dispatch({
            type: 'show-toast',
            message: 'Вложения появятся на следующем этапе.',
          })
        }
      />
    </>
  );
}
