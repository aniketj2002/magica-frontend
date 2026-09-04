"use client";

import { WelcomeScreen } from "./WelcomeScreen";
import { Composer } from "./Composer";
import { CategoryTabs } from "./CategoryTabs";
import { ShowcaseGrid } from "./ShowcaseGrid";
import { MessageList } from "./MessageList";

// For now, show the welcome state. 
// When real messages are loaded, set this to true to show the message list.
const hasMessages = false;

export function ChatShell() {
  if (hasMessages) {
    return (
      <div className="flex h-full w-full flex-col">
        <MessageList />
        <div className="pb-4">
          <Composer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full min-h-0 w-full flex-col overflow-y-auto hide-scrollbar">
      {/* Welcome section */}
      <div className="flex flex-col items-center px-4 pt-6 sm:pt-12 md:pt-24">
        <WelcomeScreen />
        
        {/* Composer */}
        <div className="mt-6 md:mt-10 w-full">
          <Composer />
        </div>
      </div>

      {/* Category tabs + showcase grid */}
      <div className="mx-auto w-full max-w-[900px] px-3 sm:px-4 pb-12">
        <div className="mt-4 sm:mt-6">
          <CategoryTabs />
        </div>
        <div className="mt-3 sm:mt-4">
          <ShowcaseGrid />
        </div>
      </div>
    </div>
  );
}
