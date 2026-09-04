"use client";

import showcaseData from "./showcase-data.json";

function CardItem({ item }: { item: (typeof showcaseData)[0] }) {
  return (
    <button
      key={item.id}
      className="group relative w-full overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-card transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-left flex flex-col cursor-pointer"
    >
      <div className="relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={item.thumbnailURL}
          alt={item.title}
          loading="lazy"
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            item.aspect === "portrait" ? "aspect-[9/14]" : "aspect-[16/10]"
          }`}
        />
        {/* Subtle soft bottom mist on video/image media */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card/45 to-transparent" />
      </div>
      <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-card border-t border-neutral-100 dark:border-neutral-800/60">
        <p className="text-[12.5px] sm:text-sm font-medium text-foreground tracking-tight line-clamp-1">
          {item.title}
        </p>
      </div>
    </button>
  );
}

export function ShowcaseGrid() {
  // 3-column split for desktop:
  // Col 1: 1, 4, 7...
  // Col 2: 2, 5, 8...
  // Col 3: 3, 6, 9...
  // Across rows: 1 2 3 / 4 5 6 / 7 8 9
  const col3_1 = showcaseData.filter((_, i) => i % 3 === 0);
  const col3_2 = showcaseData.filter((_, i) => i % 3 === 1);
  const col3_3 = showcaseData.filter((_, i) => i % 3 === 2);

  // 2-column split for mobile:
  const col2_1 = showcaseData.filter((_, i) => i % 2 === 0);
  const col2_2 = showcaseData.filter((_, i) => i % 2 === 1);

  return (
    <>
      {/* Mobile view (2 columns) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:hidden items-start">
        <div className="flex flex-col gap-3">
          {col2_1.map((item) => (
            <CardItem key={item.id} item={item} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {col2_2.map((item) => (
            <CardItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Desktop view (3 columns) */}
      <div className="hidden md:grid grid-cols-3 gap-3 sm:gap-4 items-start">
        <div className="flex flex-col gap-3 sm:gap-4">
          {col3_1.map((item) => (
            <CardItem key={item.id} item={item} />
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:gap-4">
          {col3_2.map((item) => (
            <CardItem key={item.id} item={item} />
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:gap-4">
          {col3_3.map((item) => (
            <CardItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}
