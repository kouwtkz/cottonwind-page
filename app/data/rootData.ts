import type { SetMetaBaseProps } from "~/components/SetMeta";

export interface SetRootMetaProps extends SetMetaBaseProps {
  title?: string;
  description?: string;
  isLogin?: boolean;
}

interface rootClientServerDataType {
  data: SetRootMetaProps | null;
}
export const rootClientServerData: rootClientServerDataType = { data: null };
