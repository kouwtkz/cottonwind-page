import type { SetMetaBaseProps } from "~/components/SetMeta";

export interface SetRootProps extends SetMetaBaseProps {
  title?: string;
  description?: string;
  isLogin?: boolean;
  isComplete?: boolean;
}

interface rootClientServerDataType {
  data: SetRootProps | null;
}
export const rootClientServerData: rootClientServerDataType = { data: null };
