import { toast } from "react-toastify";
import { useSoundPlayer } from "~/components/layout/SoundPlayer";
import { useSounds } from "~/components/state/SoundState";
import PlayPauseButton from "../components/svg/audio/PlayPauseButton";
import TriangleCursor from "../components/svg/cursor/Triangle";
import { useSearchParams } from "react-router";
import { useIsLogin } from "~/components/state/EnvState";
import {
  SoundAlbumEdit,
  SoundEdit,
  SoundEditButton,
  useEditSoundAlbumKey,
  useEditSoundKey,
} from "./edit/SoundEdit";
import { useCallback, useMemo } from "react";
import { RbFixedArea } from "~/components/Search";
import { findMee, setWhere } from "~/data/find/findMee";

export function SoundPage() {
  const searchParams = useSearchParams()[0];
  const qParam = searchParams.get("q");
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
    playlist: playerPlaylist,
    special: playerSpecial,
    current,
  } = useSoundPlayer();
  const special = useMemo(
    () => playerSpecial && !qParam,
    [playerSpecial, qParam],
  );
  const src = playerPlaylist.list[current]?.src || "";
  const albums = useMemo<SoundAlbumType[]>(() => {
    if (qParam) {
      const options = setWhere<SoundItemType>(qParam, {
        text: {
          key: [
            "key",
            "title",
            "artist",
            "composer",
            "album",
            "genre",
            "grouping",
          ],
        },
        hashtag: { key: ["genre", "grouping"] },
      });
      const list = findMee(sounds, options);
      return [{ key: "", playlist: { list } }];
    } else {
      const albums = soundAlbums || [];
      return isLogin && isEdit
        ? albums
        : albums.filter((album) => album.playlist);
    }
  }, [soundAlbums, isLogin, isEdit, sounds, qParam]);
  const Item = useCallback(
    ({
      sound,
      playlist,
      index,
    }: {
      sound: SoundItemType;
      playlist?: SoundPlaylistType;
      index: number;
    }) => {
      {
        const itemPaused = sound.src === src ? paused : true;
        return (
          <div
            className={"item cursor-pointer" + (itemPaused ? " paused" : "")}
            onClick={() => {
              if (isEdit) {
                setSoundKey(sound.key);
              } else {
                if (itemPaused) {
                  if (special) {
                    Play({
                      current: playerPlaylist.list.findIndex(
                        (_sound) => _sound.src === sound.src,
                      ),
                    });
                  } else {
                    Play({ playlist, current: index });
                  }
                } else Pause();
              }
            }}
          >
            <div className="cursor">
              {!isEdit && sound.src === src ? <TriangleCursor /> : null}
            </div>
            <div className="name">
              <span>{sound.title}</span>
            </div>
            {isEdit ? (
              <div className="button" />
            ) : (
              <div className="button round soft-color">
                <PlayPauseButton className="play" paused={itemPaused} />
              </div>
            )}
          </div>
        );
      }
    },
    [isEdit, src, paused, special, playerPlaylist],
  );

  return (
    <div className="soundPage">
      <RbFixedArea />
      {editSoundKey ? <SoundEdit /> : null}
      {editSoundAlbumKey ? <SoundAlbumEdit /> : null}
      <h1
        className={"title en-title-font" + (qParam ? "" : " cursor-pointer")}
        onClick={() => {
          if (!qParam) {
            if (special) {
              const playlist = soundAlbums?.find(({ playlist }) =>
                playlist?.list.some((sound) => sound.src === src),
              )?.playlist;
              if (playlist) {
                RegistPlaylist({
                  playlist,
                  current: playlist.list.findIndex(
                    (sound) => sound.src === src,
                  ),
                  special: false,
                });
                toast.info(playlist.title + "を再生", { autoClose: 1000 });
              }
            } else {
              const list = albums.reduce<SoundItemType[]>((sounds, album) => {
                album.playlist?.list.forEach((sound) => {
                  sounds.push(sound);
                });
                return sounds;
              }, []);
              RegistPlaylist({
                playlist: {
                  title: "すべて再生",
                  list,
                },
                current: list.findIndex((sound) => sound.src === src),
                special: true,
              });
              toast.info("すべて再生", { autoClose: 1000 });
            }
          }
        }}
      >
        Sound Room
      </h1>
      {isLogin ? <SoundEditButton /> : null}
      {}
      {albums.map((album, i) => {
        const playlist = album.playlist;
        return (
          <div key={`sound_playlist_${album.key}`} className="playlist">
            <h3
              className={"label" + (isEdit ? " cursor-pointer" : "")}
              onClick={() => {
                if (isEdit) setSoundAlbumKey(album.key);
              }}
            >
              {playlist?.title || album.title || album.key}
            </h3>
            <div className="list">
              {playlist?.list.map((sound, i) => (
                <Item
                  key={`sound_item_${sound.key}`}
                  sound={sound}
                  playlist={playlist}
                  index={i}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
