import type {PresenterLiveState} from './types.ts';

/** In-browser fallback for projector + presenter on one machine (AET-26). */
const CHANNEL = 'academy-live-local';

export const publishLocalPresenter = (state: PresenterLiveState): void => {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({type: 'presenter', state});
  channel.close();
};

export const subscribeLocalPresenter = (onState: (state: PresenterLiveState) => void): (() => void) => {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event) => {
    const data = event.data as {type?: string; state?: PresenterLiveState};
    if (data?.type === 'presenter' && data.state) onState(data.state);
  };
  return () => channel.close();
};
