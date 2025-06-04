import { useIsLogin } from "~/components/state/EnvState";
import { AdminMainPage } from "./AdminPage";

export function SettingPage() {
  const isLogin = useIsLogin()[0];
  return (
    <main className="h1h4Page settingPage">
      <h2 className="color-main en-title-font">Setting</h2>
      {isLogin ? (
        <div className="flex center column font-larger">
          <h3 className="color-main en-title-font">Admin</h3>
          <AdminMainPage />
        </div>
      ) : (
        <a href="/admin" className="color-main font-larger">管理者ページ</a>
      )}
    </main>
  );
}
