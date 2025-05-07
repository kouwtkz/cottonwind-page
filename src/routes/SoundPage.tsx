import { toast } from "react-toastify";
import { useSoundPlayer } from "@/layout/SoundPlayer";
import { useSounds } from "@/state/SoundState";
import PlayPauseButton from "../components/svg/audio/PlayPauseButton";
import TriangleCursor from "../components/svg/cursor/Triangle";
import { useSearchParams } from "react-router-dom";
import { useIsLogin } from "@/state/EnvState";
import {
  SoundAlbumEdit,
  SoundEdit,
  SoundEditButton,
  useEditSoundAlbumKey,
  useEditSoundKey,
} from "./edit/SoundEdit";

export function SoundPage() {
  const searchParams = useSearchParams()[0];
  const isEdit = searchParams.get("edit") === "on";
  const isLogin = useIsLogin()[0];
  const { sounds, soundAlbums } = useSounds();
  const [editSoundKey, setSoundKey] = useEditSoundKey();
  const [editSoundAlbumKey, setSoundAlbumKey] = useEditSoundAlbumKey();
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
      {editSoundKey ? <SoundEdit /> : null}
      {editSoundAlbumKey ? <SoundAlbumEdit /> : null}
      <h1
        className="title en-title-font cursor-pointer"
        onClick={() => {
          if (special) {
            const playlist = soundAlbums?.find(({ playlist }) =>
              playlist?.list.some((sound) => sound.src === src)
            )?.playlist;
            if (playlist) {
              RegistPlaylist({
                playlist,
                current: playlist.list.findIndex((sound) => sound.src === src),
                special: false,
              });
              toast.info(playlist.title + "を再生", { autoClose: 1000 });
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
            toast.info("すべて再生", { autoClose: 1000 });
          }
        }}
      >
        Sound Room
      </h1>
      {isLogin ? <SoundEditButton /> : null}
      {soundAlbums
        ?.filter((album) => album.playlist)
        .map((album, i) => {
          const playlist = album.playlist!;
          return (
            <div key={i} className="playlist">
              <h3
                className={"label" + (isEdit ? " cursor-pointer" : "")}
                onClick={() => {
                  if (isEdit) setSoundAlbumKey(album.key);
                }}
              >
                {playlist.title}
              </h3>
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
                        if (isEdit) {
                          setSoundKey(sound.key);
                        } else {
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
                        }
                      }}
                    >
                      <div className="cursor">
                        {!isEdit && sound.src === src ? (
                          <TriangleCursor />
                        ) : null}
                      </div>
                      <div className="name">
                        <span>{sound.title}</span>
                      </div>
                      {isEdit ? (
                        <div className="button" />
                      ) : (
                        <div className="button round soft-color">
                          <PlayPauseButton
                            className="play"
                            paused={itemPaused}
                          />
                        </div>
                      )}
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
