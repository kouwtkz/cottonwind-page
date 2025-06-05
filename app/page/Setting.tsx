import { useIsLogin } from "~/components/state/EnvState";
import { AdminMainPage } from "./AdminPage";
import { Link } from "react-router";

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
        <Link to="/admin" className="color-main font-larger">管理者ページ</Link>
      )}
    </main>
  );
}
