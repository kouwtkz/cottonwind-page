import { useMemo } from "react";
import { useApiOrigin, useIsLogin, useMediaOrigin } from "@/state/EnvState";
import { Link, useParams } from "react-router-dom";
import { GalleryManageMenuButton, GalleryObject } from "./GalleryPage";
import { useImageState } from "@/state/ImageState";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDialog } from "@/components/FileTool";
import { filesDataObject } from "@/state/DataState";
import { MdFileUpload } from "react-icons/md";
import { FilesUpload } from "./edit/FilesEdit";
import { useFiles } from "@/state/FileState";
import { concatOriginUrl } from "@/functions/originUrl";

export function SettingPage() {
  const isLogin = useIsLogin()[0];
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
            <Link to="files">ファイル管理ページ</Link>
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
    case "files":
      return <FilesManager />;
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
      <GalleryObject items={items} showInPageMenu={false} />
      <GalleryManageMenuButton />
    </main>
  );
}
function FilesManager() {
  const apiOrigin = useApiOrigin()[0];
  const mediaOrigin = useMediaOrigin()[0];
  const setFilesLoad = filesDataObject.useLoad()[1];
  const files = useFiles()[0];
  return (
    <>
      <RbButtonArea>
        <button
          type="button"
          className="round large"
          title="ファイルのアップロード"
          onClick={async () => {
            fileDialog("*", true)
              .then((files) => Array.from(files))
              .then((files) =>
                FilesUpload({ path: "/file/send", files, apiOrigin })
              )
              .then(() => {
                setFilesLoad("no-cache");
              });
          }}
        >
          <MdFileUpload />
        </button>
      </RbButtonArea>
      <main>
        <h2 className="color en-title-font">File Manager</h2>
        <div className="flex column">
          {files?.map((file, i) => {
            return (
              <div key={i}>
                <a target="file" href={concatOriginUrl(mediaOrigin, file.src)}>{file.key}</a>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
