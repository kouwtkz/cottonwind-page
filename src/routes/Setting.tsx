import { isLoginAtom } from "@/state/EnvState";
import { useAtom } from "jotai";

export function SettingPage() {
  const isLogin = useAtom(isLoginAtom)[0];
  return (
    <main className="h1h4Page large">
      <h1>SETTING</h1>
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
