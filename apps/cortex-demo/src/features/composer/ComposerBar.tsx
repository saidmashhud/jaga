import { ContextComposer } from '@cortex/ui';
import { useCortex } from '../../state/CortexProvider';

export function ComposerBar() {
  const { state, dispatch, submitComposer } = useCortex();

  return (
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
  );
}
