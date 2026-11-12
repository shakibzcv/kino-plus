/**
 * Global Player Coordinator
 * Ensures ONLY ONE video player can ever play audio/video at any given time.
 * When a player starts playing, any previously playing player is automatically paused.
 */

type PauseCallback = () => void;

let activePauser: PauseCallback | null = null;

export function registerActivePlayer(pauser: PauseCallback): void {
  if (activePauser && activePauser !== pauser) {
    try {
      activePauser();
    } catch (err) {
      console.warn('[GlobalPlayer] Error pausing previous player:', err);
    }
  }
  activePauser = pauser;
}

export function unregisterActivePlayer(pauser: PauseCallback): void {
  if (activePauser === pauser) {
    activePauser = null;
  }
}

export function pauseAllPlayers(): void {
  if (activePauser) {
    try {
      activePauser();
    } catch (err) {
      console.warn('[GlobalPlayer] Error during pauseAllPlayers:', err);
    }
    activePauser = null;
  }
}
