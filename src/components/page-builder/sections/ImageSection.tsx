interface ImageContent {
  url?: string;
  alt?: string;
  caption?: string;
}

interface ImageSectionProps {
  content: ImageContent;
}

export default function ImageSection({ content }: ImageSectionProps) {
  const { url, alt, caption } = content;

  if (!url) {
    return null;
  }

  return (
    <section className="w-full bg-white px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <figure className="overflow-hidden rounded-xl shadow-md">
          <img
            src={url}
            alt={alt ?? ""}
            className="h-auto w-full object-cover"
            loading="lazy"
            decoding="async"
          />

          {caption && (
            <figcaption className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-500">
              {caption}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}
