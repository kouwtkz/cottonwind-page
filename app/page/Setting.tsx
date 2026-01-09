import { useIsLogin } from "~/components/state/EnvState";
import { AdminMainPage } from "./AdminPage";
import { Link } from "react-router";
import { dbClass } from "~/data/ClientDBLoader";

export function SettingPage() {
  const isLogin = useIsLogin()[0];
  return (
    <main className="h1h4Page settingPage">
      <h2 className="color-main en-title-font">Setting</h2>
      {isLogin ? (
        <div className="flex center column font-larger">
          <h3 className="color-main en-title-font">Admin</h3>
          <PurgeDatabaseAnchor />
          <AdminMainPage />
        </div>
      ) : (
        <div className="flex center column font-larger">
          <PurgeDatabaseAnchor />
          <Link to="/admin">管理者ページ</Link>
        </div>
      )}
    </main>
  );
}

export function PurgeDatabaseAnchor(
  props: Omit<React.HTMLAttributes<HTMLElement>, "onClick">
) {
  return (
    <a
      children="データベースの再読み込み"
      {...props}
      href="#purgeDB"
      title="purge database button"
      onClick={(e) => {
        e.preventDefault();
        if (
          confirm(
            "データベースの再読み込みしますか？\n" +
              "(多めのデータ通信を行います)"
          )
        ) {
          try {
            dbClass.deleteDatabase();
            dbClass.close();
          } catch {}
          location.href = "/";
        }
      }}
    ></a>
  );
}
