export function toLikePath(url: string | URL) {
  const matched = url.toString().match(/(:\/\/[^\/]+|)([^\?]*)(\?.*|)(#.*|)$/) || [];
  const pathname = matched[2];
  const searchParams = new URLSearchParams(matched[3]);
  if (searchParams.has("image")) {
    return "?image=" + searchParams.get("image");
  } else if (searchParams.has("postId")) {
    return "?postId=" + searchParams.get("postId");
  } else return pathname;
}