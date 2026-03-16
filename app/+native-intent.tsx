export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  if (path.includes("share-intent")) {
    return "/save";
  }
  return path;
}
