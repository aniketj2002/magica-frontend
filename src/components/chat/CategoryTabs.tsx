"use client";

import { useState } from "react";

const categories = [
  "All",
  "Viral Video Formats",
  "Video Special Effects",
  "Content Creation",
  "Branding & Design",
  "Image & Editing",
];

export function CategoryTabs() {
  const [active, setActive] = useState("All");

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActive(cat)}
          className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm transition-colors cursor-pointer ${
            active === cat
              ? "bg-neutral-100 dark:bg-neutral-800 text-foreground font-semibold"
              : "text-neutral-500 dark:text-neutral-400 hover:text-foreground hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 font-medium"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
