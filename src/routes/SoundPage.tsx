import toast from "react-hot-toast";
import { useSoundPlayer } from "@/state/SoundPlayer";
import { useSoundAlbum, useSounds } from "@/state/SoundState";
import PlayPauseButton from "../components/svg/audio/PlayPauseButton";
import TriangleCursor from "../components/svg/cursor/Triangle";
import { useSearchParams } from "react-router-dom";
import { useIsLogin } from "@/state/EnvState";

export function SoundPage() {
  const searchParams = useSearchParams()[0];
  const isEdit = searchParams.get("edit") === "on";
  const isLogin = useIsLogin()[0];
  return (
    <div className="soundPage">
      {isLogin && isEdit ? null : (
        <>
          {/* {isLogin ? <CharaEditButton /> : null} */}
          <SoundMainPage />
        </>
      )}
    </div>
  );
}

function SoundMainPage() {
  const sounds = useSounds()[0];
  const soundAlbum = useSoundAlbum()[0];
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
    <>
      <h1
        className="title en-title-font cursor-pointer"
        onClick={() => {
          if (special) {
            const playlist = soundAlbum?.playlist?.find((item) =>
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
                list: sounds || [],
              },
              current: sounds?.findIndex((sound) => sound.src === src),
              special: true,
            });
            toast("すべて再生", { duration: 1000 });
          }
        }}
      >
        Sound Room
      </h1>
      {soundAlbum?.playlist?.map((playlist, i) => {
        return (
          <div key={i} className="playlist">
            <h3 className="label">{playlist.title}</h3>
            <div className="list">
              {playlist.list.map((sound, i) => {
                const itemPaused = sound.src === src ? paused : true;
                return (
                  <div
                    key={i}
                    className={
                      "item cursor-pointer" + (itemPaused ? " paused" : "")
                    }
                    onClick={() => {
                      if (itemPaused) {
                        if (special) {
                          Play({
                            current: sounds?.findIndex(
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
    </>
  );
}
