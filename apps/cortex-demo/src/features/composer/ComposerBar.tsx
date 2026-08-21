import { ContextComposer } from '@cortex/ui';
import { useCortex } from '../../state/CortexProvider';
import { Pending } from './Pending';

export function ComposerBar() {
  const { state, dispatch, submitComposer } = useCortex();

  return (
    <>
      {/* Что уже принято, но ещё не разобрано. Стоит над полем, чтобы запись
          не пропадала из виду на те минуты, пока модель её читает. */}
      <Pending version={state.addedActivities.length + (state.composerProcessing ? 1 : 0)} />
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
