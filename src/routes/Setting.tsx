import { isLoginAtom } from "@/state/EnvState";
import { useAtom } from "jotai";
import { Link } from "react-router-dom";

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
