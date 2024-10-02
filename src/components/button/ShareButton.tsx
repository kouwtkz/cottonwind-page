import React, { HTMLAttributes } from "react";
import { MdOutlineShare } from "react-icons/md";

interface ShareButtonProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "type"> {
  share?: ShareData;
}
export default function ShareButton({ share, ...props }: ShareButtonProps) {
  return (
    <button
      type="button"
      title="シェアする"
      className="iconSwitch"
      onClick={async () => {
        const data: ShareData = {
          title: document.title,
          url: location.href,
          ...share,
        };
        try {
          if (navigator.canShare(data)) {
            await navigator.share(data);
          }
        } catch (error) {
          console.error(error);
        }
      }}
      {...props}
    >
      <MdOutlineShare />
    </button>
  );
}
