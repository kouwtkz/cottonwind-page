import React from "react";
import { useSoundPlayer } from "@/state/SoundPlayer";
import PlayPauseButton from "@/components/svg/audio/PlayPauseButton";
import StopButton from "@/components/svg/audio/StopButton";
import LoopButton from "@/components/svg/audio/LoopButton";
import PrevButton from "@/components/svg/audio/PrevButton";
import NextButton from "@/components/svg/audio/NextButton";
import ShuffleButton from "@/components/svg/audio/ShuffleButton";
import { useLocation } from "react-router-dom";

export default function SoundFixed() {
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
  return (
    <>
      {/sound/.test(pathname) || !paused || !ended ? (
        <div className="soundFixed">
          <div>
            <div>
              <StopButton onClick={() => Stop()} />
              <LoopButton loopMode={loopMode} onClick={() => NextLoopMode()} />
              <ShuffleButton
                shuffle={shuffle}
                onClick={() => ToggleShuffle()}
              />
            </div>
            <div>
              <PrevButton onClick={() => Prev()} />
              <PlayPauseButton
                paused={paused}
                onClick={() => (paused ? Play() : Pause())}
              />
              <NextButton onClick={() => Next()} />
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
