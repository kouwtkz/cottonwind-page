import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaOrigin } from "@/state/EnvState";
import { concatOriginUrl } from "@/functions/originUrl";
import MebtteMediaSession from "@mebtte/react-media-session";
import { useLocation } from "react-router-dom";
import StopButton from "@/components/svg/audio/StopButton";
import LoopButton from "@/components/svg/audio/LoopButton";
import ShuffleButton from "@/components/svg/audio/ShuffleButton";
import PrevButton from "@/components/svg/audio/PrevButton";
import PlayPauseButton from "@/components/svg/audio/PlayPauseButton";
import NextButton from "@/components/svg/audio/NextButton";
import {
  CreateObjectState,
  CreateState,
  setTypeProps,
} from "@/state/CreateState";
import ReactSlider from "react-slider";

import {
  RiMenuFold4Fill,
  RiMenuUnfold4Fill,
  RiPauseLine,
  RiPlayFill,
  RiStopMiniFill,
  RiVolumeDownFill,
  RiVolumeMuteFill,
  RiVolumeUpFill,
} from "react-icons/ri";
import { DropdownObject } from "@/components/dropdown/DropdownMenu";
import { parseBlob } from "music-metadata";
import { useSounds } from "@/state/SoundState";

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
  stopped: boolean;
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
  volume: number;
  muted: boolean;
  RegistPlaylist: (args: PlaylistRegistProps) => void;
  Play: (args?: setTypeProps<SoundPlayerType>) => void;
  Pause: () => void;
  Stop: () => void;
  Next: () => void;
  Prev: () => void;
  NextLoopMode: () => void;
  ToggleShuffle: () => void;
  SetVolume: (volume: number, delta?: boolean) => void;
};

export const useSoundPlayer = CreateObjectState<SoundPlayerType>((set) => ({
  paused: true,
  ended: true,
  stopped: true,
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
  volume: 0.5,
  muted: false,
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
  Play: (args) => {
    set((state) => {
      let { playlist, ...argsValue } = {} as Partial<SoundPlayerType>;
      if (typeof args === "function") args(state);
      else if (typeof args === "object") {
        const { playlist: _playlist, ..._argsValue } = args;
        playlist = _playlist;
        argsValue = _argsValue;
      }
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
  SetVolume(volume, delta) {
    set((state) => {
      volume = delta ? volume + state.volume : volume;
      if (volume > 1) volume = 1;
      else if (volume < 0) volume = 0;
      return { volume, muted: false };
    });
  },
}));

export const useSoundPlaylist = CreateState<SoundPlaylistType>();
export function SoundPlayer() {
  const mediaOrigin = useMediaOrigin()[0];
  const { Set: SetSounds } = useSounds();
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
    Play,
    Pause,
    volume,
    muted,
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
    if (mediaOrigin && src) return concatOriginUrl(mediaOrigin, src);
  }, [mediaOrigin, src]);

  const onPreviousTrack = useCallback(() => Prev(), [Prev]);
  const onNextTrack = useCallback(() => Next(), [Next]);
  const onSeekBackward = useCallback(() => {
    if (audioElm) audioElm.currentTime -= 10;
  }, [audioElm]);
  const onSeekForward = useCallback(() => {
    if (audioElm) audioElm.currentTime += 10;
  }, [audioElm]);
  const autoPlay = useMemo(() => !ended, [ended]);
  useEffect(() => {
    if (audioElm) audioElm.volume = volume;
  }, [audioElm, volume]);
  useEffect(() => {
    if (audioElm) audioElm.muted = muted;
  }, [audioElm, muted]);
  useEffect(() => {
    if (jumpTime >= 0 && audioElm) {
      const currentTime = jumpTime;
      audioElm.currentTime = currentTime;
      Set({ jumpTime: -1, currentTime, jumped: true });
    }
  }, [jumpTime, audioElm]);
  const stopped = useMemo(() => paused && ended, [paused, ended]);
  useEffect(() => Set({ stopped }), [stopped]);
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
    () => Set({ duration: !ended && audioElm ? audioElm.duration : 0 }),
    [audioElm?.duration, ended]
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
    if (!audioElm || stopped) return;
    const interval = setInterval(() => {
      Set({
        currentTime: audioElm?.currentTime,
      });
    }, 100);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [intervalState, stopped, audioElm]);

  const callbackMetaData = useCallback(
    (music: SoundItemType, mediaSrc: string) => {
      if (!music.meta) {
        fetch(mediaSrc)
          .then((r) => r.blob())
          .then((blob) => parseBlob(blob))
          .then((meta) => {
            SetSounds(({ soundsMap }) => {
              const item = soundsMap.get(music.key)!;
              item.meta = meta;
              item.common = meta.common;
              return {
                soundsMap: new Map(soundsMap),
                sounds: Array.from(soundsMap.values()),
              };
            });
          });
      }
    },
    []
  );
  useEffect(() => {
    if (!paused && music && mediaSrc) callbackMetaData(music, mediaSrc);
  }, [paused, music, mediaSrc]);

  const artwork = useMemo(
    () =>
      music.cover && mediaOrigin
        ? [
            {
              src: concatOriginUrl(mediaOrigin, music.cover),
              sizes: "512x512",
            },
          ]
        : [],
    [music, mediaOrigin]
  );

  return (
    <>
      <SoundController />
      <MebtteMediaSession
        title={music.title}
        artist={music.artist}
        album={playlist.title || music.album}
        {...{
          artwork,
          onPlay: Play,
          onPause: Pause,
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

export function SoundController() {
  const { pathname } = useLocation();
  const {
    Set,
    Play,
    Pause,
    Stop,
    Prev,
    Next,
    NextLoopMode,
    ToggleShuffle,
    paused,
    ended,
    stopped,
    loopMode,
    playlist,
    current,
    shuffle,
    SetVolume,
    volume,
    muted,
  } = useSoundPlayer();
  const sound = playlist.list[current];
  const title = sound?.title || null;
  const artist = sound?.artist || null;
  const composer = sound?.common?.composer?.join(", ") || artist;
  const show = useMemo(
    () => /sound/.test(pathname) || !paused || !ended,
    [pathname, paused, ended]
  );
  const onClickPlayPause = useCallback(() => {
    if (paused) Play();
    else Pause();
  }, [paused, Play, Pause]);
  const [showBox, setShowBox] = useState(true);
  const soundControllerClass = useMemo(() => {
    const className = ["soundController"];
    if (showBox) className.push("showBox");
    if (show) className.push("show");
    return className.join(" ");
  }, [showBox, show]);

  const onWheelVolumeSwitch = useCallback((e: WheelEvent) => {
    e.preventDefault();
    SetVolume(-Math.sign(e.deltaY) / 50, true);
  }, []);
  const volumeDivRef = useRef<HTMLDivElement>(null);
  const volumeSliderElm = useMemo(
    () => volumeDivRef.current?.querySelector("div.slider"),
    [volumeDivRef.current]
  );
  useEffect(() => {
    if (volumeSliderElm) {
      const clipElm = document.createElement("div");
      clipElm.className = "clip";
      const items = Array.from(volumeSliderElm.children);
      items.forEach((item) => {
        clipElm.appendChild(item);
      });
      volumeSliderElm.appendChild(clipElm);
    }
  }, [volumeSliderElm]);
  const currentVolume = useMemo(() => volume * 100, [volume]);
  // const [isVolumeSwitch, setVolumeSwitch] = useState(false);
  // const volumeSliderBoxClass = useMemo(() => {
  //   const classNames = [];
  //   if (!isVolumeSwitch) classNames.push("disabled");
  //   return classNames.join(" ");
  // }, [isVolumeSwitch]);
  const VolumeIcon = useCallback(
    () => (
      <>
        {muted || volume === 0 ? (
          <RiVolumeMuteFill className="small" />
        ) : volume < 0.6 ? (
          <RiVolumeDownFill className="small" />
        ) : (
          <RiVolumeUpFill className="small" />
        )}
      </>
    ),
    [volume, muted]
  );
  useEffect(() => {
    const elm = volumeDivRef.current;
    if (elm) {
      elm.addEventListener("wheel", onWheelVolumeSwitch, {
        passive: false,
      });
      return () => {
        elm.removeEventListener("wheel", onWheelVolumeSwitch);
      };
    }
  }, [volumeDivRef]);
  return (
    <>
      <div className={soundControllerClass}>
        <div className="mini">
          <button
            title="停止"
            className="color round"
            type="button"
            onClick={Stop}
            hidden={stopped}
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
            <div className="meta">
              {stopped ? (
                <p className="wait">（たいきちゅう）</p>
              ) : (
                <>
                  {title ? <p className="title">{"♪ " + title}</p> : null}
                  {composer !== artist ? <p>編曲: {artist}</p> : null}
                  {composer ? <p>作曲: {composer}</p> : null}
                </>
              )}
            </div>
            <SoundControllerTime />
            <div className="controll">
              <div className="left">
                <DropdownObject
                  className="volume"
                  ref={volumeDivRef}
                  classNames={{
                    dropItemList: "sliderBox",
                  }}
                  MenuButton={<VolumeIcon />}
                  title="音量を変更する"
                  hiddenClassName="disabled"
                  keepActiveOpen
                >
                  <button
                    type="button"
                    title="ミュート切り替え"
                    onClick={() => Set((s) => ({ muted: !s.muted }))}
                  >
                    <VolumeIcon />
                  </button>
                  <ReactSlider
                    thumbClassName="thumb"
                    trackClassName="track"
                    max={100}
                    value={currentVolume}
                    onChange={(value) => {
                      SetVolume(value / 100);
                    }}
                  />
                </DropdownObject>
              </div>
              <div className="center">
                <button type="button" title="前の曲" onClick={Prev}>
                  <PrevButton />
                </button>
                <button
                  type="button"
                  title="再生 / 一時停止"
                  className="round large"
                  onClick={onClickPlayPause}
                >
                  <PlayPauseButton paused={paused} />
                </button>
                <button type="button" title="次の曲" onClick={Next}>
                  <NextButton />
                </button>
              </div>
              <div className="right">
                <button
                  type="button"
                  title="シャッフル"
                  className="small"
                  onClick={ToggleShuffle}
                >
                  <ShuffleButton shuffle={shuffle} />
                </button>
                <button
                  type="button"
                  title="ループモード"
                  className="small"
                  onClick={NextLoopMode}
                >
                  <LoopButton loopMode={loopMode} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SoundControllerTime() {
  const { Play, Pause, paused, stopped, currentTime, duration } =
    useSoundPlayer();
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
    <div className="time">
      <div className="status">
        <div className="text">
          <span className="current">{currentTimeStr}</span>
          <span className="slash">/</span>
          <span className="duration">{durationStr}</span>
        </div>
      </div>
      <ReactSlider
        disabled={stopped}
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
          Play({ jumpTime });
        }}
        renderThumb={({ key, ...props }, state) => {
          return <div {...props} key="audio-slider-thumb" />;
        }}
      />
    </div>
  );
}
