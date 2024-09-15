import { isLoginAtom } from "@/state/EnvState";
import { useAtom } from "jotai";
import { Link, useParams } from "react-router-dom";
import { GalleryManageMenuButton, GalleryObject } from "./GalleryPage";
import { useImageState } from "@/state/ImageState";
import { useMemo } from "react";

export function SettingPage() {
  const isLogin = useAtom(isLoginAtom)[0];
  return (
    <main>
      <h2 className="color en-title-font">Setting</h2>
      <h4>せってい</h4>
      <div className="flex center column large">
        {isLogin ? (
          <>
            <a href="/workers" title="Workersページ">
              Workersのページ
            </a>
            <Link to="images">画像管理ページ</Link>
          </>
        ) : null}
      </div>
    </main>
  );
}

export function SettingDetailPage() {
  const params = useParams();
  switch (params.key) {
    case "images":
      return <ImagesManager />;
    default:
      return <></>;
  }
}

function ImagesManager() {
  const { imageAlbums: albums } = useImageState();
  const items = useMemo(() => {
    return Object.values(Object.fromEntries(albums || []));
  }, [albums]);
  return (
    <main>
      <h2 className="color en-title-font">Images Manager</h2>
      <GalleryObject
        items={items}
        showInPageMenu={false}
      />
      <GalleryManageMenuButton />
    </main>
  );
}
