import { useCallback, useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { useMediaOrigin } from "./EnvState";
import { concatOriginUrl } from "@/functions/originUrl";
import MebtteMediaSession from "@mebtte/react-media-session";
import { useLocation } from "react-router-dom";
import StopButton from "@/components/svg/audio/StopButton";
import LoopButton from "@/components/svg/audio/LoopButton";
import ShuffleButton from "@/components/svg/audio/ShuffleButton";
import PrevButton from "@/components/svg/audio/PrevButton";
import PlayPauseButton from "@/components/svg/audio/PlayPauseButton";
import NextButton from "@/components/svg/audio/NextButton";
import { CreateState } from "./CreateState";

const LoopModeList: SoundLoopMode[] = [
  "loop",
  "loopOne",
  "playUntilEnd",
  "off",
];

type PlaylistRegistType = SoundItemType | SoundItemType[] | SoundPlaylistType;
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
  count: number;
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
  count: 0,
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
      playlist?: SoundPlaylistType | undefined;
      current?: number;
      special?: boolean;
    } = { current };
    if (special !== undefined) value.special = special;
    value.playlist = _playlist
      ? "list" in _playlist
        ? _playlist
        : { list: Array.isArray(_playlist) ? _playlist : [_playlist] }
      : undefined;
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
      const value: Partial<SoundPlayerType> = {
        paused: false,
        ended: false,
        count: 0,
      };
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
      let newState: Partial<SoundPlayerType>;
      if (state.shuffle) {
        let current = Math.floor(
          Math.random() * (state.playlist.list.length - 1)
        );
        if (current >= state.current) current++;
        newState = { current };
      } else if (
        state.loopMode === "playUntilEnd" &&
        state.playlist.list.length === state.current + 1
      ) {
        newState = { paused: true, ended: true };
      } else
        newState = {
          current: (state.current + 1) % state.playlist.list.length,
        };
      newState.count = state.current === newState.current ? state.count + 1 : 0;
      return newState;
    });
  },
  Prev: () => {
    set((state) => {
      let newState: Partial<SoundPlayerType>;
      if (state.loopMode === "playUntilEnd" && state.current === 0) {
        newState = { current: state.current === 0 ? 0 : state.current - 1 };
      } else {
        const length = state.playlist.list.length;
        newState = { current: (length + state.current - 1) % length };
      }
      newState.count = state.current === newState.current ? state.count + 1 : 0;
      return newState;
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

export const useSoundPlaylist = CreateState<SoundPlaylistType>();
export function SoundPlayer() {
  const mediaOrigin = useMediaOrigin()[0];
  const {
    playlist,
    current,
    Play,
    Pause,
    loopMode,
    Prev,
    Next,
    Stop,
    paused,
    ended,
    count,
  } = useSoundPlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioElm = audioRef.current;
  const listLength = useMemo(() => playlist.list.length, [playlist.list]);
  const music = useMemo(
    () => playlist.list[current] || {},
    [playlist, current]
  );
  const src = useMemo(() => music?.src, [music, current]);
  const mediaSrc = useMemo(
    () => concatOriginUrl(mediaOrigin, src),
    [mediaOrigin, src]
  );
  const onPlay = useCallback(() => audioElm!.play(), [audioElm]);
  const onPause = useCallback(() => audioElm!.pause(), [audioElm]);
  const onPreviousTrack = useCallback(() => Prev(), [Prev]);
  const onNextTrack = useCallback(() => Next(), [Next]);
  const onSeekBackward = useCallback(() => {
    if (audioElm) audioElm.currentTime -= 10;
  }, []);
  const onSeekForward = useCallback(() => {
    if (audioElm) audioElm.currentTime += 10;
  }, []);
  const autoPlay = useMemo(() => !ended, [ended]);
  useEffect(() => {
    if (audioElm) {
      if (audioElm.paused !== paused) {
        if (ended) audioElm.currentTime = 0;
        if (paused) audioElm.pause();
        else audioElm.play();
      }
    }
  }, [paused, ended, audioElm]);
  useEffect(() => {
    if (audioElm && count > 0) audioElm.currentTime = 0;
  }, [count, audioElm]);

  const onEnded = useCallback(() => {
    function replay() {
      if (audioElm) {
        audioElm.currentTime = 0;
        audioElm.play();
      }
    }
    switch (loopMode) {
      case "loop":
      case "playUntilEnd":
        Next();
        if (listLength <= 1) replay();
        break;
      case "loopOne":
        replay();
        break;
      case "off":
        Stop();
        break;
    }
  }, [loopMode, audioElm, Stop, listLength]);
  const artwork = useMemo(
    () =>
      music.cover
        ? [
            {
              src: concatOriginUrl(mediaOrigin, music.cover),
              sizes: "512x512",
            },
          ]
        : [],
    [music]
  );

  return (
    <>
      <SoundFixed />
      <MebtteMediaSession
        title={music.title}
        artist={music.artist}
        album={playlist.title || music.album}
        {...{
          artwork,
          onPlay,
          onPause,
          onPreviousTrack,
          onNextTrack,
          onSeekBackward,
          onSeekForward,
        }}
      />
      <audio
        src={mediaSrc}
        {...{ autoPlay, onEnded }}
        onPlay={() => {
          if (paused) Play();
        }}
        onPause={() => {
          if (!audioElm!.ended && !paused) Pause();
        }}
        ref={audioRef}
      />
    </>
  );
}

function SoundFixed() {
  const { pathname } = useLocation();
  const {
    Play,
    Pause,
    Stop,
    Prev,
    Next,
    NextLoopMode,
    ToggleShuffle,
    paused,
    ended,
    loopMode,
    playlist,
    current,
    shuffle,
  } = useSoundPlayer();
  const title = playlist.list[current]?.title || null;
  const show = useMemo(
    () => /sound/.test(pathname) || !paused || !ended,
    [pathname, paused, ended]
  );
  return (
    <>
      {show ? (
        <div className="soundFixed">
          <div>
            <div>
              <StopButton className="cursor-pointer" onClick={() => Stop()} />
              <LoopButton
                className="cursor-pointer"
                loopMode={loopMode}
                onClick={() => NextLoopMode()}
              />
              <ShuffleButton
                className="cursor-pointer"
                shuffle={shuffle}
                onClick={() => ToggleShuffle()}
              />
            </div>
            <div>
              <PrevButton className="cursor-pointer" onClick={() => Prev()} />
              <PlayPauseButton
                className="cursor-pointer"
                paused={paused}
                onClick={() => (paused ? Play() : Pause())}
              />
              <NextButton className="cursor-pointer" onClick={() => Next()} />
            </div>
            <div className="text">
              {title && !(paused && ended) ? "♪ " + title : "（たいきちゅう）"}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
