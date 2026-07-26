import type { CharacterSession } from '../../domain/character';
import type { RestPreview, RestResult } from '../../domain/rest';

export interface SessionHistoryEntry {
  readonly id: number;
  readonly message: string;
  readonly timestamp: string;
}
export interface SessionControllerState {
  readonly session: CharacterSession;
  readonly undoSession: CharacterSession | null;
  readonly history: readonly SessionHistoryEntry[];
  readonly preview: RestPreview | null;
  readonly error: string | null;
}
export class SessionController {
  private value: SessionControllerState;
  private sequence = 0;
  constructor(
    session: CharacterSession,
    private readonly persist: (session: CharacterSession) => void = () =>
      undefined,
  ) {
    this.value = {
      session: structuredClone(session),
      undoSession: null,
      history: [],
      preview: null,
      error: null,
    };
  }
  get state(): SessionControllerState {
    return this.value;
  }
  execute(
    command: (session: CharacterSession) => CharacterSession,
    message: string,
  ): SessionControllerState {
    try {
      const previous = this.value.session;
      const session = command(previous);
      this.persist(session);
      this.value = {
        session,
        undoSession: previous,
        preview: null,
        error: null,
        history: [
          { id: ++this.sequence, message, timestamp: new Date().toISOString() },
          ...this.value.history,
        ],
      };
    } catch (error) {
      this.value = {
        ...this.value,
        error:
          error instanceof Error ? error.message : 'Session change failed.',
      };
    }
    return this.value;
  }
  setPreview(preview: RestPreview | null) {
    this.value = { ...this.value, preview };
    return this.value;
  }
  performRest(result: RestResult, message: string) {
    if (!result.success) {
      this.value = { ...this.value, error: 'The rest could not be completed.' };
      return this.value;
    }
    return this.execute(() => result.session, message);
  }
  undoLastSessionChange(): SessionControllerState {
    if (!this.value.undoSession)
      return { ...this.value, error: 'There is no session change to undo.' };
    const session = this.value.undoSession;
    this.persist(session);
    this.value = {
      session,
      undoSession: null,
      preview: null,
      error: null,
      history: [
        {
          id: ++this.sequence,
          message: 'Undid last session change',
          timestamp: new Date().toISOString(),
        },
        ...this.value.history,
      ],
    };
    return this.value;
  }
}
