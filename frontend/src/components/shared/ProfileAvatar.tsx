import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { mediaUrl } from "../../lib/utils";

export function ProfileAvatar({
  src,
  name,
  className = "",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const resolved = mediaUrl(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [resolved]);
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300/30 via-violet-400/30 to-pink-400/30 font-bold text-cyan-100 ${className}`}
    >
      {resolved && !failed ? (
        <img
          src={resolved}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <UserRound
          aria-label={`${initials} profile placeholder`}
          className="h-1/2 w-1/2"
          strokeWidth={1.6}
        />
      )}
    </span>
  );
}
