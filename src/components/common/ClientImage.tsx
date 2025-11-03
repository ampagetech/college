"use client";

import Image from "next/image";

interface ClientImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

export default function ClientImage({ src, alt, fill, className, priority }: ClientImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      onError={(e) => {
        const imgElement = e.target as HTMLImageElement;
        imgElement.onerror = null;
        imgElement.src =
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f0f0f0'/><text x='50%' y='50%' fill='%23888' text-anchor='middle' alignment-baseline='middle'>Image Not Found</text></svg>";
      }}
    />
  );
}