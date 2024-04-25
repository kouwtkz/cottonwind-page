interface responseTokenType {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  scope?: string;
  refresh_token?: string;
}
interface responseUserType {
  data?: TwitterUserType
}
interface TwitterUserType {
  id?: string;
  name?: string;
  username?: string;
}
interface kvTokenType extends responseTokenType {
  limit?: number;
  user?: TwitterUserType;
}

interface PostTestProps {
  text: string;
  token: kvTokenType | null;
}
type TweetScope = "tweet.read" | "tweet.write" | "tweet.moderate.write" | "users.read"
  | "follows.read" | "follows.write" | "offline.access" | "space.read"
  | "mute.read" | "mute.write" | "like.read" | "like.write" | "list.read" | "list.write"
  | "block.read" | "block.write" | "bookmark.read" | "bookmark.write";
