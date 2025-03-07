import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CreateObjectState, CreateState } from "./CreateState";
import ReactSlider from "react-slider";

import {
  RiMenuFold4Fill,
  RiMenuUnfold4Fill,
  RiPauseLine,
  RiPlayFill,
  RiStopMiniFill,
} from "react-icons/ri";

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
  duration: number;
  currentTime: number;
  prevReplayTime: number;
  jumpTime: number;
  jumped: boolean;
  RegistPlaylist: (args: PlaylistRegistProps) => void;
  Play: (args?: Partial<SoundPlayerType>) => void;
  Pause: () => void;
  Stop: () => void;
  Next: () => void;
  Prev: () => void;
  NextLoopMode: () => void;
  ToggleShuffle: () => void;
};

export const useSoundPlayer = CreateObjectState<SoundPlayerType>((set) => ({
  paused: true,
  ended: true,
  playlist: { list: [] },
  current: 0,
  count: 0,
  loopMode: LoopModeList[0],
  shuffle: false,
  special: false,
  duration: 0,
  currentTime: 0,
  prevReplayTime: 3,
  jumpTime: 0,
  jumped: false,
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
  Play: (args = {}) => {
    set((state) => {
      const { playlist, ...argsValue } = args;
      const value: Partial<SoundPlayerType> = {
        ...{
          paused: false,
          ended: false,
          count: 0,
        },
        ...argsValue,
      };
      if (playlist) state.RegistPlaylist({ playlist });
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
      if (!state.ended) newState.paused = false;
      newState.count = state.current === newState.current ? state.count + 1 : 0;
      return newState;
    });
  },
  Prev: () => {
    set((state) => {
      let newState: Partial<SoundPlayerType>;
      if (state.currentTime > state.prevReplayTime) {
        newState = { current: state.current };
      } else if (state.loopMode === "playUntilEnd" && state.current === 0) {
        newState = { current: state.current === 0 ? 0 : state.current - 1 };
      } else {
        const length = state.playlist.list.length;
        newState = { current: (length + state.current - 1) % length };
      }
      if (!state.ended) newState.paused = false;
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
    loopMode,
    Prev,
    Next,
    Stop,
    paused,
    ended,
    count,
    Set,
    jumpTime,
    jumped,
  } = useSoundPlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioElm = audioRef.current;
  const listLength = useMemo(() => playlist.list.length, [playlist.list]);
  const music = useMemo(
    () => playlist.list[current] || {},
    [playlist, current]
  );
  const src = useMemo(() => music?.src, [music, current]);
  const mediaSrc = useMemo(() => {
    if (src) return concatOriginUrl(mediaOrigin, src);
  }, [mediaOrigin, src]);

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
    if (jumpTime >= 0 && audioElm) {
      audioElm.currentTime = jumpTime;
      Set({ jumpTime: -1, jumped: true });
    }
  }, [jumpTime, audioElm]);
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
  useEffect(
    () => Set({ duration: audioElm?.duration || 0 }),
    [audioElm?.duration]
  );
  const [intervalState, setIntervalState] = useState<number>(-1);
  const onTimeUpdate = useCallback(() => {
    if (audioElm) {
      const currentTime = audioElm.currentTime;
      if (jumped || !currentTime) {
        Set({ currentTime, jumped: false });
        setIntervalState((v) => v + 1);
      }
    }
  }, [audioElm, jumped]);
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      Set(({ currentTime }) => ({
        currentTime: currentTime + 0.25,
      }));
    }, 250);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [intervalState, paused]);

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
        {...{ autoPlay, onEnded, onTimeUpdate }}
        ref={audioRef}
      />
    </>
  );
}

function DurationToStr(duration: number, emptyToHyphen?: boolean) {
  if (!duration && emptyToHyphen) return "-:--";
  const floorTime = Math.floor(duration);
  const s = floorTime % 60;
  const m = (floorTime - s) / 60;
  return `${m}:${("00" + s).slice(-2)}`;
}

export function SoundFixed() {
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
    currentTime,
    duration,
  } = useSoundPlayer();
  const sound = playlist.list[current];
  const title = sound?.title || null;
  const show = useMemo(
    () => /sound/.test(pathname) || !paused || !ended,
    [pathname, paused, ended]
  );
  const onClickPlayPause = useCallback(() => {
    if (paused) Play();
    else Pause();
  }, [paused, Play, Pause]);
  const [showBox, setShowBox] = useState(true);
  const soundFixedClass = useMemo(() => {
    const className = ["soundFixed"];
    if (showBox) className.push("showBox");
    return className.join(" ");
  }, [showBox]);
  const currentPerT = useMemo(
    () => Math.round((currentTime / (duration || 1)) * 1000),
    [currentTime, duration]
  );
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const currentTimeWithSlider = useMemo(() => {
    if (sliderValue !== null)
      return Math.round((duration * sliderValue) / 100) / 10;
    else if (duration === 0) return null;
    else return currentTime;
  }, [sliderValue, currentTime, duration]);
  const currentTimeStr = useMemo(
    () =>
      DurationToStr(currentTimeWithSlider || 0, currentTimeWithSlider === null),
    [currentTimeWithSlider]
  );
  const durationStr = useMemo(() => DurationToStr(duration, true), [duration]);

  return (
    <>
      {show ? (
        <div className={soundFixedClass}>
          <div className="mini">
            <button
              title="停止"
              className="color round player"
              type="button"
              onClick={Stop}
            >
              <RiStopMiniFill />
            </button>
            <button
              title="再生 / 一時停止"
              className="color round player"
              type="button"
              onClick={onClickPlayPause}
            >
              {paused ? <RiPlayFill /> : <RiPauseLine strokeWidth="1px" />}
            </button>
            <button
              title="展開"
              className="color round"
              type="button"
              onClick={() => setShowBox(!showBox)}
            >
              {showBox ? <RiMenuUnfold4Fill /> : <RiMenuFold4Fill />}
            </button>
          </div>
          <div className="box">
            <div className="player">
              <div>
                <button type="button" title="停止" onClick={Stop}>
                  <StopButton />
                </button>
                <button
                  type="button"
                  title="ループモード"
                  onClick={NextLoopMode}
                >
                  <LoopButton loopMode={loopMode} />
                </button>
                <button
                  type="button"
                  title="シャッフル"
                  onClick={ToggleShuffle}
                >
                  <ShuffleButton shuffle={shuffle} />
                </button>
              </div>
              <div>
                <button type="button" title="前の曲" onClick={Prev}>
                  <PrevButton />
                </button>
                <button
                  type="button"
                  title="再生 / 一時停止"
                  onClick={onClickPlayPause}
                >
                  <PlayPauseButton paused={paused} />
                </button>
                <button type="button" title="次の曲" onClick={Next}>
                  <NextButton />
                </button>
              </div>
              <div className="text">
                {title && !(paused && ended)
                  ? "♪ " + title
                  : "（たいきちゅう）"}
              </div>
              <div>
                {currentTimeStr} / {durationStr}
              </div>
              <div className="time">
                <ReactSlider
                  className="slider"
                  disabled={ended}
                  thumbClassName="thumb"
                  trackClassName="track"
                  max={1000}
                  value={currentPerT}
                  onChange={(value) => {
                    setSliderValue(value);
                  }}
                  onBeforeChange={() => {
                    if (!paused) Pause();
                  }}
                  onAfterChange={(jump) => {
                    setSliderValue(null);
                    const jumpTime = Math.round((duration * jump) / 100) / 10;
                    Play({
                      jumpTime,
                      currentTime: jumpTime,
                    });
                  }}
                  renderThumb={({ key, ...props }, state) => {
                    return <div {...props} key="audio-slider-thumb" />;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
