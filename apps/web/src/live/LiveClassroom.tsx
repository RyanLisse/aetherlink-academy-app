import {useEffect, useMemo, useRef, useState} from 'react';
import {Deck, type DeckMode, type DeckSlide} from '@academy/deck';
import {AssignmentCard} from './AssignmentCard.tsx';
import {WebMcpRegistration} from '../webmcp/index.ts';
import {publishLocalPresenter, subscribeLocalPresenter} from './broadcast.ts';
import {LiveClient, type LiveSnapshot} from './client.ts';
import {PresenceBar} from './PresenceBar.tsx';
import type {FollowLiveState, LiveEvent, PresenceSnapshot, PresenterLiveState} from './types.ts';
import './live.css';

export interface LiveClassroomProps {
  readonly roomId: string;
  readonly role: 'facilitator' | 'participant';
  readonly mode: DeckMode;
  readonly slides: ReadonlyArray<DeckSlide>;
  readonly participantId: string;
  readonly name: string;
  readonly baseUrl?: string;
}

const emptyPresence = (): PresenceSnapshot => ({following: [], detached: [], evidence: []});

export function LiveClassroom(props: LiveClassroomProps) {
  const [presenter, setPresenter] = useState<PresenterLiveState | null>(null);
  const [follow, setFollow] = useState<FollowLiveState | null>(null);
  const [presence, setPresence] = useState<PresenceSnapshot>(emptyPresence);
  const [notice, setNotice] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [connection, setConnection] = useState('connecting');
  const clientRef = useRef<LiveClient | null>(null);

  useEffect(() => {
    const client = new LiveClient({
      roomId: props.roomId,
      participantId: props.participantId,
      name: props.name,
      role: props.role,
      ...(props.baseUrl ? {baseUrl: props.baseUrl} : {}),
      onConnectionChange: setConnection,
      onEvent: (event) => {
        const e = event as LiveEvent | LiveSnapshot | {type: string; notice?: string; timerRemaining?: number | null; state?: PresenterLiveState; follow?: FollowLiveState; presence?: PresenceSnapshot};
        if (e.type === 'snapshot') {
          const snap = e as LiveSnapshot;
          setPresenter(snap.presenter);
          setFollow(snap.follow);
          setPresence(snap.presence);
          setTimerRemaining(snap.timerRemaining ?? null);
          return;
        }
        if (e.type === 'presenter' && e.state) {
          setPresenter(e.state);
          if ('timerRemaining' in e) setTimerRemaining((e as {timerRemaining?: number | null}).timerRemaining ?? null);
          if (props.role === 'facilitator') publishLocalPresenter(e.state);
          return;
        }
        if (e.type === 'follow' && e.state) {
          const state = e.state as FollowLiveState;
          // Only apply own follow row — other participants' detach/follow must not clobber us.
          if (state.participantId === props.participantId) setFollow(state);
          return;
        }
        if (e.type === 'presence' && e.presence) {
          setPresence(e.presence);
          return;
        }
        if (e.type === 'everyoneBackToFollow' || e.type === 'notice') {
          setNotice((e as {notice: string}).notice);
          return;
        }
      },
    });
    clientRef.current = client;
    void client.command('join').finally(() => client.start());
    const unsubLocal =
      props.mode === 'projector'
        ? subscribeLocalPresenter((state) => {
            setPresenter(state);
          })
        : () => {};
    return () => {
      client.stop();
      unsubLocal();
    };
  }, [props.roomId, props.participantId, props.name, props.role, props.mode, props.baseUrl]);

  // Tick timer locally from server remaining + wall clock after each snapshot
  useEffect(() => {
    if (timerRemaining == null) return;
    const started = Date.now();
    const base = timerRemaining;
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setTimerRemaining(Math.max(0, base - elapsed));
    }, 1000);
    return () => window.clearInterval(id);
  }, [presenter?.timerStartedAt, presenter?.timerMinutes, presenter?.pauseUntil]);

  const following = follow?.following !== false;
  const index = useMemo(() => {
    if (!presenter) return 0;
    if (props.role === 'participant' && !following) return follow?.ownIndex ?? presenter.slideIndex;
    return presenter.slideIndex;
  }, [presenter, follow, following, props.role]);

  const revealStep = following || props.role === 'facilitator' ? (presenter?.revealStep ?? -1) : -1;
  // Detached participants browse locally (AET-26 AC); follow mode locks navigation.
  const deckMode: DeckMode = props.role === 'participant' && !following ? 'projector' : props.mode;
  const slide = props.slides[index] ?? props.slides[0];

  const onIndexChange = (next: number) => {
    if (props.role === 'facilitator') void clientRef.current?.command('gotoSlide', {index: next});
    else if (!following) {
      setFollow((f) => (f ? {...f, ownIndex: next} : f));
    }
  };
  const onRevealStepChange = (step: number) => {
    if (props.role === 'facilitator') void clientRef.current?.command('setReveal', {step});
  };

  return (
    <div
      className={`live-classroom role-${props.role} mode-${props.mode}`}
      data-testid="live-classroom"
      data-connection={connection}
      data-slide-index={index}
      data-lesson={presenter?.lesson ?? ""}
      data-route={props.role === "participant" ? `/live/${props.roomId}` : undefined}
    >
      {notice && (
        <div className="live-notice" role="status" data-testid="live-notice">
          {notice}
          <button type="button" onClick={() => setNotice(null)}>
            OK
          </button>
        </div>
      )}
      {props.role === 'facilitator' && (
        <div className="live-facilitator-bar">
          <PresenceBar presence={presence} />
          <button type="button" data-testid="everyone-back" onClick={() => void clientRef.current?.command('everyoneBackToFollow')}>
            Iedereen terug volgen
          </button>
          <button type="button" data-testid="next-slide" onClick={() => void clientRef.current?.command('nextSlide')}>
            Volgende slide
          </button>
          <button
            type="button"
            data-testid="start-timer"
            onClick={() => void clientRef.current?.command('startTimer', {minutes: 5})}
          >
            Start timer
          </button>
        </div>
      )}
      {props.role === 'participant' && (
        <div className="live-participant-bar">
          {following ? (
            <button type="button" data-testid="detach" onClick={() => void clientRef.current?.command('detach')}>
              Los
            </button>
          ) : (
            <button type="button" data-testid="follow-again" onClick={() => void clientRef.current?.command('followAgain')}>
              Volg weer
            </button>
          )}
          <span data-testid="follow-status">{following ? 'Volgend' : 'Losgekoppeld'}</span>
          {timerRemaining != null && <span data-testid="follow-timer">Timer {timerRemaining}s</span>}
        </div>
      )}
      <Deck
        slides={props.slides}
        index={index}
        revealStep={revealStep}
        mode={deckMode}
        presence={<PresenceBar presence={presence} />}
        onIndexChange={onIndexChange}
        onRevealStepChange={onRevealStepChange}
      />
      {props.mode === 'follow' && slide && <AssignmentCard slide={slide} timerRemaining={timerRemaining} />}
      {props.role === 'participant' && props.mode === 'follow' && (
        <WebMcpRegistration connectionState="configured" />
      )}
      <button type="button" hidden data-testid="kill-ws" onClick={() => clientRef.current?.killWebSocket()} />
    </div>
  );
}
