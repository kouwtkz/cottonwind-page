import { type HTMLAttributes, useEffect, useMemo, useState } from "react";
import { RiHeart3Fill } from "react-icons/ri";
import { toast } from "react-toastify";
import { toastLoadingOptions } from "../define/toastContainerDef";
import { useLocation } from "react-router";
import { toLikePath } from "~/components/functions/media/likeFunction";
import { apiOrigin, likeDataIndexed } from "~/data/ClientDBLoader";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { useLikeState } from "~/components/state/LikeState";
import { customFetch } from "../functions/fetch";
import { GetAPIFromOptions, likeDataOptions } from "~/data/DataEnv";

const SEND_API = GetAPIFromOptions(likeDataOptions, "/send");

interface LikeButtonProps extends HTMLAttributes<HTMLButtonElement> {
  url?: string;
  checked?: boolean;
}
export function LikeButton({
  url,
  checked,
  className,
  children,
  onClick,
  title,
  ...props
}: LikeButtonProps) {
  const { pathname, search } = useLocation();
  if (!url) url = pathname + search;
  const pathKey = useMemo(() => toLikePath(url), [url]);
  const { likeMap } = useLikeState();
  const thisLikeData = useMemo(() => likeMap?.get(pathKey), [likeMap, pathKey]);
  checked = useMemo(() => {
    if (typeof checked === "boolean") return checked;
    else {
      return Boolean(thisLikeData?.checked);
    }
  }, [checked, thisLikeData]);
  className = useMemo(() => {
    const list = ["like"];
    if (checked) list.push("checked");
    if (className) list.push(className);
    return list.join(" ");
  }, [className, checked]);
  title = useMemo(() => {
    if (title) return title;
    else if (checked) return "いいねを外す";
    else return "いいねを付ける";
  }, [title, checked]);
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        if (checked) {
          customFetch(concatOriginUrl(apiOrigin, SEND_API), {
            data: {
              path: pathKey,
              mode: "remove",
            } as LikeFormType,
            method: "POST",
            cors: true,
          }).then(() => {
            likeDataIndexed.load("no-cache");
            toast("いいねを解除しました", toastLoadingOptions);
          });
        } else {
          customFetch(concatOriginUrl(apiOrigin, SEND_API), {
            data: {
              path: pathKey,
              mode: "add",
            } as LikeFormType,
            method: "POST",
            cors: true,
          }).then(() => {
            likeDataIndexed.load("no-cache");
            toast("いいねしました", toastLoadingOptions);
          });
        }
        if (onClick) onClick(e);
      }}
      title={title}
      {...props}
    >
      <RiHeart3Fill />
      <span className="count">{thisLikeData?.count || 0}</span>
      {children}
    </button>
  );
}
