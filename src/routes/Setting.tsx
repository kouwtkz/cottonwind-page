import { isLoginAtom } from "@/state/EnvState";
import { useAtom } from "jotai";

export function SettingPage() {
  const isLogin = useAtom(isLoginAtom)[0];
  return (
    <main>
      <h2 className="color en-title-font">Setting</h2>
      <h4>せってい</h4>
      {isLogin ? (
        <>
          <a href="/workers" title="Workersページ">
            Workersのページ
          </a>
        </>
      ) : null}
    </main>
  );
}
