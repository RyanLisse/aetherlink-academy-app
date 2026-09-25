export type {ActionDefinition, ActionIntent, ActionScope} from './action.ts';
export {defineAction} from './action.ts';
export {registry} from './actions/index.ts';
export {toChatTools} from './adapters/chat.ts';
export {ActionsHttpApi, ActionsHttpHandlers, toHttpApiGroup} from './adapters/http.ts';
export {toMcpTools} from './adapters/mcp.ts';
export type {ActionDescriptor, ActionTool, ActionToolCallArgs} from './adapters/tool-adapter.ts';
export {buildActionTools, describeActions} from './adapters/tool-adapter.ts';
export type {RemoteActionInvoke, WebMcpTool} from './adapters/web-mcp.ts';
export {toWebMcpTools} from './adapters/web-mcp.ts';
export type {Caller, ActionRole} from './caller.ts';
export {CallerResolver, type CallerResolverShape} from './caller-resolver.ts';
export {ConfirmationStore, ConfirmationStoreLive, type ConfirmationBinding, type ConfirmationStoreShape} from './confirmation.ts';
export {dispatch, dispatchDecoded, decodeInput, encodeOutput, hashEncoded, type DispatchRequest} from './dispatcher.ts';
export * from './errors.ts';
export {toFullJsonSchema} from './json-schema.ts';
export {emptyRegistry, findAction, registerAction, type ActionRegistry} from './registry.ts';
export {LivePresenter, requireLiveRoom, type LivePresenterShape} from './actions/live-state.ts';
export {ReleasePolicy, requireSquadRoom, type ReleasePolicyShape} from './actions/release-policy.ts';
export {
  AcademyContent,
  AcademyContentLive,
  AcademyContentMemory,
  type AcademyContentShape,
  type LessonRecord,
  type AssignmentRecord,
  ParticipantContext,
  ParticipantContextLive,
  ParticipantContextMemory,
  AmbiguousViewContext,
  type ParticipantViewBinding,
  ContentSearch,
  SearchHit,
  SearchLocale,
  type ContentSearchShape,
  type SearchAudience,
  LessonNotReleased,
  LOCKED_LESSON_DENIAL,
  lockedLessonDenialBody,
  requireReleased,
} from './actions/index.ts';
