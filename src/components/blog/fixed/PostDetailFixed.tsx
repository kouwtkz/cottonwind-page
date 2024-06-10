import { Suspense } from "react";
import PostButton from "./PostButton";
import SearchArea from "./SearchArea";
import BackForwardPost from "./BackForwardPost";
import HandsClapButton from "./HandsClapButton";
import { useManageState } from "@/state/StateSet";

type props = { postId: string; posts: Post[] };

export default function Main(args: props) {
  const isLogin = import.meta.env.DEV || useManageState().isLogin;
  return (
    <Suspense>
      <div className="fixed rightBottom">
        <div className="list">
          <div className="list">
            <BackForwardPost {...args} />
            <SearchArea />
            {isLogin ? (
              <PostButton postId={args.postId} />
            ) : (
              <HandsClapButton />
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
