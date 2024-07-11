import toast from "react-hot-toast";
import { useSoundPlayer } from "../state/SoundPlayer";
import { SoundState, useSoundState } from "../state/SoundState";
import PlayPauseButton from "../components/svg/audio/PlayPauseButton";
import TriangleCursor from "../components/svg/cursor/Triangle";

export function SoundPage() {
  const { SoundAlbum, SoundItemList } = useSoundState();
  const {
    Play,
    Pause,
    paused,
    RegistPlaylist,
    playlist: playerList,
    special,
    current,
  } = useSoundPlayer();
  const src = playerList.list[current]?.src || "";

  return (
    <div className="soundPage">
      <SoundState />
      <h1
        className="title"
        onClick={() => {
          if (special) {
            const playlist = SoundAlbum?.playlist?.find((item) =>
              item.list.some((sound) => sound.src === src)
            );
            if (playlist) {
              RegistPlaylist({
                playlist,
                current: playlist.list.findIndex((sound) => sound.src === src),
                special: false,
              });
              toast(playlist.title + "を再生", { duration: 1000 });
            }
          } else {
            RegistPlaylist({
              playlist: {
                title: "すべて再生",
                list: SoundItemList,
              },
              current: SoundItemList.findIndex((sound) => sound.src === src),
              special: true,
            });
            toast("すべて再生", { duration: 1000 });
          }
        }}
      >
        SOUND ROOM
      </h1>
      {SoundAlbum?.playlist?.map((playlist, i) => {
        return (
          <div key={i} className="playlist">
            <h3 className="label">{playlist.title}</h3>
            <div className="list">
              {playlist.list.map((sound, i) => {
                const itemPaused = sound.src === src ? paused : true;
                return (
                  <div
                    key={i}
                    className={"item" + (itemPaused ? " paused" : "")}
                    onClick={() => {
                      if (itemPaused) {
                        if (special) {
                          Play({
                            current: SoundItemList.findIndex(
                              (_sound) => _sound.src === sound.src
                            ),
                          });
                        } else {
                          Play({ playlist, current: i });
                        }
                      } else Pause();
                    }}
                  >
                    <div className="cursor">
                      {sound.src === src ? <TriangleCursor /> : null}
                    </div>
                    <div className="name">
                      <span>{sound.title}</span>
                    </div>
                    <PlayPauseButton className="play" paused={itemPaused} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
