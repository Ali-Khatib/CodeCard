'use client';

import { cn } from '@/lib/utils';

interface ImageSource {
  src: string;
  alt: string;
}

interface ShowImageListItemProps {
  text: string;
  images: [ImageSource, ImageSource];
}

function RevealImageListItem({ text, images }: ShowImageListItemProps) {
  const container = 'absolute right-8 -top-1 z-40 h-20 w-16';
  const effect =
    'relative duration-500 delay-100 shadow-none group-hover:shadow-xl scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 group-hover:w-full group-hover:h-full w-16 h-16 overflow-hidden transition-all rounded-md';

  return (
    <div className="group relative h-fit w-fit overflow-visible py-8">
      <h1 className="text-7xl font-black text-foreground transition-all duration-500 group-hover:opacity-40">
        {text}
      </h1>
      <div className={container}>
        <div className={effect}>
          <img alt={images[1].alt} src={images[1].src} className="h-full w-full object-cover" />
        </div>
      </div>
      <div
        className={cn(
          container,
          'translate-x-0 translate-y-0 rotate-0 transition-all delay-150 duration-500 group-hover:translate-x-6 group-hover:translate-y-6 group-hover:rotate-12',
        )}
      >
        <div className={cn(effect, 'duration-200')}>
          <img alt={images[0].alt} src={images[0].src} className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function RevealImageList() {
  const items: ShowImageListItemProps[] = [
    {
      text: 'Branding',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          alt: 'Image 1',
        },
        {
          src: 'https://images.unsplash.com/photo-1567262439850-1d4dc1fefdd0?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          alt: 'Image 2',
        },
      ],
    },
    {
      text: 'Web design',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          alt: 'Image 1',
        },
        {
          src: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          alt: 'Image 2',
        },
      ],
    },
    {
      text: 'Illustration',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1575995872537-3793d29d972c?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          alt: 'Image 1',
        },
        {
          src: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          alt: 'Image 2',
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-1 rounded-sm bg-background px-8 py-4">
      <h3 className="text-sm font-black uppercase text-muted-foreground">Our services</h3>
      {items.map((item, index) => (
        <RevealImageListItem key={index} text={item.text} images={item.images} />
      ))}
    </div>
  );
}

function RevealImageListDemo() {
  return (
    <div className="block">
      <RevealImageList />
    </div>
  );
}

function RevealProjectImages({
  images,
  className,
}: {
  images: ImageSource[];
  className?: string;
}) {
  const previewImages = images.slice(0, 2);
  if (previewImages.length === 0) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute right-4 top-4 z-20 hidden h-24 w-28 md:block',
        className,
      )}
      aria-hidden
    >
      {previewImages.map((image, index) => (
        <a
          key={`${image.src}-${index}`}
          href={image.src}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'pointer-events-auto absolute h-20 w-24 overflow-hidden rounded-xl border border-white/40 bg-white/70 opacity-0 shadow-xl backdrop-blur-sm transition-all duration-500 group-hover/project:opacity-100',
            index === 0
              ? 'right-3 top-2 rotate-[-7deg] scale-75 group-hover/project:translate-x-[-8px] group-hover/project:translate-y-1 group-hover/project:scale-100'
              : 'right-0 top-0 rotate-[8deg] scale-75 delay-75 group-hover/project:translate-x-3 group-hover/project:translate-y-5 group-hover/project:scale-100',
          )}
        >
          <img alt={image.alt} src={image.src} className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}

export { RevealImageList, RevealImageListDemo, RevealImageListItem, RevealProjectImages };
