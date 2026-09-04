import { PlaceholderScreen } from "@/components/chat/PlaceholderScreen";

function formatSlug(slug: string): string {
  const map: Record<string, string> = {
    projects: "Projects",
    library: "Library",
    tools: "Tools",
    api: "API / MCP",
    help: "Help & Support",
    advantage: "Unfair Advantage",
    settings: "Settings",
  };
  return map[slug.toLowerCase()] || (slug.charAt(0).toUpperCase() + slug.slice(1));
}

export default async function DynamicPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PlaceholderScreen fallbackTitle={formatSlug(slug)} />;
}
