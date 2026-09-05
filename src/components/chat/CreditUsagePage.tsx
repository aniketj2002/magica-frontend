"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  ClipboardList,
  Layers,
  Calendar,
  ChevronDown,
  Eye,
  Info,
  ArrowRight,
} from "lucide-react";
import { useCreditUsage, useBalance } from "@/hooks/queries";
import type { CreditUsageItem, CreditUsageShow } from "@/lib/api/types";
import { toolLabel } from "@/lib/tools/registry";
import { UsageDetailsDialog } from "@/components/chat/UsageDetailsDialog";

function formatCredits(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(4)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toFixed(4);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })}, ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })}`;
}

type PeriodKey = "current_month" | "last_30d" | "last_90d" | "all";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "current_month", label: "Current Period" },
  { key: "last_30d", label: "Last 30 days" },
  { key: "last_90d", label: "Last 90 days" },
  { key: "all", label: "All time" },
];

const SHOW_OPTIONS: { key: CreditUsageShow; label: string }[] = [
  { key: "debited", label: "Debited Credits" },
  { key: "credited", label: "Credited Credits" },
  { key: "all", label: "All Credits" },
];

function periodRange(period: PeriodKey): { from?: string; to?: string } {
  const now = new Date();
  if (period === "all") return {};
  if (period === "current_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      to: now.toISOString(),
    };
  }
  const days = period === "last_30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: now.toISOString() };
}

export function CreditUsagePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "detailed">(
    "overview",
  );
  const [show, setShow] = useState<CreditUsageShow>("debited");
  const [period, setPeriod] = useState<PeriodKey>("current_month");
  const [showMenuOpen, setShowMenuOpen] = useState(false);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<CreditUsageItem | null>(null);

  const range = useMemo(() => periodRange(period), [period]);
  const { data, isLoading, isError, error } = useCreditUsage({
    ...range,
    show,
  });
  const { data: balanceData } = useBalance();

  const items = useMemo(() => {
    if (!data?.items) return [];
    return [...data.items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [data?.items]);

  const overviewRows = useMemo(() => {
    const map = new Map<
      string,
      {
        toolName: string;
        amount: number;
        executions: number;
        latestUsage: string;
      }
    >();
    for (const item of items) {
      const cur = map.get(item.toolName);
      if (!cur) {
        map.set(item.toolName, {
          toolName: item.toolName,
          amount: item.amount,
          executions: 1,
          latestUsage: item.createdAt,
        });
        continue;
      }
      cur.amount += item.amount;
      cur.executions += 1;
      if (new Date(item.createdAt) > new Date(cur.latestUsage)) {
        cur.latestUsage = item.createdAt;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestUsage).getTime() - new Date(a.latestUsage).getTime(),
    );
  }, [items]);

  const categories = useMemo(
    () =>
      overviewRows.map((row) => ({
        name: row.toolName,
        total: row.amount,
        count: row.executions,
      })),
    [overviewRows],
  );

  const activeCategory =
    selectedCategory && categories.some((c) => c.name === selectedCategory)
      ? selectedCategory
      : (categories[0]?.name ?? null);

  const detailedItems = useMemo(
    () =>
      activeCategory
        ? items.filter((i) => i.toolName === activeCategory)
        : items,
    [items, activeCategory],
  );

  const activeCategoryStats = categories.find((c) => c.name === activeCategory);

  const periodLabel = data
    ? `${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`
    : "—";
  const showLabel =
    SHOW_OPTIONS.find((o) => o.key === show)?.label ?? "Debited Credits";
  const periodOptionLabel =
    PERIOD_OPTIONS.find((o) => o.key === period)?.label ?? "Current Period";

  return (
    <div className="flex flex-1 h-full w-full flex-col overflow-y-auto hide-scrollbar">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-8 py-8 sm:py-12">
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Chat</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          AI Credits Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your AI usage and optimize credit spend
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Coins className="h-4 w-4 text-muted-foreground" />}
            label={show === "credited" ? "TOTAL CREDITED" : "TOTAL DEBITED"}
            value={
              isLoading
                ? "—"
                : `${formatCredits(
                    show === "credited"
                      ? (data?.totalCredited ?? 0)
                      : (data?.totalDebited ?? 0),
                  )} credits`
            }
          />
          <StatCard
            icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
            label="EXECUTIONS"
            value={isLoading ? "—" : String(data?.totalExecutions ?? 0)}
          />
          <StatCard
            icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            label="CATEGORIES"
            value={isLoading ? "—" : String(data?.categories ?? 0)}
          />
          <StatCard
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            label="PERIOD"
            value={isLoading ? "—" : periodLabel}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <FilterDropdown
            label="Show"
            value={showLabel}
            open={showMenuOpen}
            onToggle={() => {
              setShowMenuOpen((o) => !o);
              setPeriodMenuOpen(false);
              setCategoryMenuOpen(false);
            }}
          >
            {SHOW_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setShow(opt.key);
                  setShowMenuOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </FilterDropdown>

          <FilterDropdown
            label="Period"
            value={periodOptionLabel}
            open={periodMenuOpen}
            onToggle={() => {
              setPeriodMenuOpen((o) => !o);
              setShowMenuOpen(false);
              setCategoryMenuOpen(false);
            }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setPeriod(opt.key);
                  setPeriodMenuOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </FilterDropdown>

          <div className="ml-auto text-sm text-muted-foreground hidden sm:block">
            {periodLabel}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Earlier usage is still available
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch Period to All time or Last 90 days to include older
                executions. Overview shows net by tool; Detailed View lists each
                run.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPeriod("all")}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors whitespace-nowrap"
          >
            Open All Time
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-6 flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
              activeTab === "overview"
                ? "bg-background text-foreground border-r border-border"
                : "bg-card text-muted-foreground hover:text-foreground border-r border-border"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("detailed")}
            className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
              activeTab === "detailed"
                ? "bg-background text-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Detailed View
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="mt-6 rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Tool Name
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Net Credits
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Executions
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Latest Usage
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          Loading usage data…
                        </div>
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-red-600 dark:text-red-400"
                      >
                        {error instanceof Error
                          ? error.message
                          : "Failed to load credit usage"}
                      </td>
                    </tr>
                  ) : overviewRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        No usage data for this period
                      </td>
                    </tr>
                  ) : (
                    overviewRows.map((row) => (
                      <tr
                        key={row.toolName}
                        className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {toolLabel(row.toolName)}
                        </td>
                        <td className="px-4 py-3 text-foreground tabular-nums">
                          {formatCredits(row.amount)}
                        </td>
                        <td className="px-4 py-3 text-foreground tabular-nums">
                          {row.executions}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {formatDateTime(row.latestUsage)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(row.toolName);
                              setActiveTab("detailed");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                          >
                            Detailed View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Detailed records
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select a usage category, then open a record to inspect step
                  costs.
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryMenuOpen((o) => !o);
                    setShowMenuOpen(false);
                    setPeriodMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {activeCategory
                    ? `${toolLabel(activeCategory)} - ${formatCredits(activeCategoryStats?.total ?? 0)}`
                    : "No categories"}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {categoryMenuOpen && categories.length > 0 && (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[240px] overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setCategoryMenuOpen(false);
                        }}
                      >
                        {toolLabel(cat.name)} - {formatCredits(cat.total)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3.5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {activeCategory ? toolLabel(activeCategory) : "Usage"} usage
                    executions
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activeCategoryStats?.count ?? 0} executions in the selected
                    period
                  </p>
                </div>
                <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                  {show === "credited"
                    ? "Credited"
                    : show === "all"
                      ? "All"
                      : "Debited"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/60">
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Credits Used
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          Loading usage data…
                        </td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-12 text-center text-red-600 dark:text-red-400"
                        >
                          {error instanceof Error
                            ? error.message
                            : "Failed to load credit usage"}
                        </td>
                      </tr>
                    ) : detailedItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No usage data for this period
                        </td>
                      </tr>
                    ) : (
                      detailedItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                            {formatCredits(item.amount)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setDetailsItem(item)}
                              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <UsageDetailsDialog
          item={detailsItem}
          open={detailsItem !== null}
          onOpenChange={(open) => {
            if (!open) setDetailsItem(null);
          }}
        />

        {balanceData && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
            <span className="text-sm text-muted-foreground">
              Current Available Balance
            </span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {formatCredits(balanceData.balance)} credits
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
      >
        {value}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-10 z-20 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 flex flex-col gap-1.5 transition-all hover:shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="text-[15px] font-semibold text-foreground">{value}</span>
    </div>
  );
}
