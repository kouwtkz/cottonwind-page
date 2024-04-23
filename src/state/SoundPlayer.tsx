import { useRef } from "react";
import { create } from "zustand";
import SoundFixed from "../components/layout/SoundFixed";
import { getBasename } from "../components/doc/PathParse";
const LoopModeList: SoundLoopMode[] = ["loop", "loopOne", "playUntilEnd", "off"];

type PlaylistRegistType =
  | string
  | string[]
  | SoundItemType
  | SoundItemType[]
  | SoundPlaylistType;
export type PlaylistRegistProps = {
  playlist?: PlaylistRegistType;
  current?: number;
  special?: boolean;
};

type SoundPlayerType = {
  paused: boolean;
  ended: boolean;
  playlist: SoundPlaylistType;
  current: number;
  loopMode: SoundLoopMode;
  shuffle: boolean;
  special: boolean;
  SetPaused: (paused: boolean) => void;
  SetEnded: (ended: boolean) => void;
  RegistPlaylist: (args: PlaylistRegistProps) => void;
  SetCurrent: (current: number) => void;
  SetLoopMode: (loopMode: SoundLoopMode, current?: number) => void;
  SetShuffle: (shuffle: boolean) => void;
  Play: (args?: PlaylistRegistProps) => void;
  Pause: () => void;
  Stop: () => void;
  Next: () => void;
  Prev: () => void;
  NextLoopMode: () => void;
  ToggleShuffle: () => void;
};

export const useSoundPlayer = create<SoundPlayerType>((set) => ({
  paused: true,
  ended: true,
  playlist: { list: [] },
  current: 0,
  loopMode: LoopModeList[0],
  shuffle: false,
  special: false,
  SetPaused: (paused) => {
    set(() => ({ paused }));
  },
  SetEnded: (ended) => {
    set(() => ({ ended }));
  },
  RegistPlaylist: ({ playlist: _playlist, current = 0, special }) => {
    const value: {
      playlist?: SoundPlaylistType;
      current?: number;
      special?: boolean;
    } = { current };
    if (special !== undefined) value.special = special;
    if (Array.isArray(_playlist)) {
      value.playlist = {
        list: _playlist.map((item) =>
          typeof item === "string"
            ? { src: item, title: getBasename(item) }
            : item
        ),
      };
    } else {
      if (typeof _playlist === "string")
        value.playlist = {
          list: [{ src: _playlist, title: getBasename(_playlist) }],
        };
      else if (_playlist) {
        if ((_playlist as any).list !== undefined) {
          value.playlist = _playlist as SoundPlaylistType;
        } else {
          value.playlist = { list: [_playlist as SoundItemType] };
        }
      }
    }
    set(() => value);
  },
  SetCurrent: (current) => {
    set(() => ({ current }));
  },
  SetLoopMode: (loopMode) => {
    set(() => ({ loopMode }));
  },
  SetShuffle(shuffle) {
    set(() => ({ shuffle }));
  },
  Play: (args = {}) => {
    set((state) => {
      const value: { paused: boolean; current?: number } = { paused: false };
      if (args.playlist) state.RegistPlaylist(args);
      else if (args.current !== undefined) value.current = args.current;
      return value;
    });
  },
  Pause: () => {
    set(() => ({ paused: true, ended: false }));
  },
  Stop: () => {
    set(() => ({ paused: true, ended: true, current: 0 }));
  },
  Next: () => {
    set((state) => {
      if (state.shuffle) {
        let current = Math.floor(
          Math.random() * (state.playlist.list.length - 1)
        );
        if (current >= state.current) current++;
        return { current };
      } else if (
        state.loopMode === "playUntilEnd" &&
        state.playlist.list.length === state.current + 1
      ) {
        return { paused: true, ended: true };
      } else
        return { current: (state.current + 1) % state.playlist.list.length };
    });
  },
  Prev: () => {
    set((state) => {
      if (state.loopMode === "playUntilEnd" && state.current === 0) {
        return { current: state.current === 0 ? 0 : state.current - 1 };
      } else {
        const length = state.playlist.list.length;
        return { current: (length + state.current - 1) % length };
      }
    });
  },
  NextLoopMode: () => {
    set((state) => ({
      loopMode:
        LoopModeList[
          (LoopModeList.indexOf(state.loopMode) + 1) % LoopModeList.length
        ],
    }));
  },
  ToggleShuffle() {
    set((state) => ({ shuffle: !state.shuffle }));
  },
}));

export function SoundPlayer() {
  const refAudio = useRef<HTMLAudioElement>(null);
  const audioElm = refAudio.current;
  const { paused, ended, Stop, playlist, current, loopMode, Next } =
    useSoundPlayer();
  const src = playlist.list[current]?.src || "";
  if (audioElm) {
    if (src && !audioElm.src.endsWith(src)) audioElm.src = src;
    if (audioElm.paused !== paused) {
      if (paused) {
        audioElm.pause();
      } else {
        if (ended) audioElm.currentTime = 0;
        audioElm.play();
      }
    }
  }
  const html = typeof window === "object" ? document?.documentElement : null;
  if (paused) {
    html?.classList.remove("audio_play");
  } else {
    html?.classList.add("audio_play");
  }
  return (
    <>
      <SoundFixed />
      <audio
        ref={refAudio}
        onEnded={() => {
          switch (loopMode) {
            case "loop":
            case "playUntilEnd":
              Next();
              break;
            case "loopOne":
              if (audioElm) {
                audioElm.currentTime = 0;
                audioElm.play();
              }
              break;
            case "off":
              Stop();
              break;
          }
        }}
      />
    </>
  );
}
