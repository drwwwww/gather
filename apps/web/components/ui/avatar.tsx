"use client";

import { useState } from "react";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
}

export default function Avatar({
  name,
  imageUrl,
  size = 36,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = imageUrl && !imgError;

  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center bg-primary text-white font-semibold select-none"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}