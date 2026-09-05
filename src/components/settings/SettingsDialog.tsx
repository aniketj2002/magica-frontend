"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Settings as SettingsIcon, BarChart3, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SettingsTab = "general" | "billing";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>("billing");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(640px,85vh)] p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage account preferences and billing
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[320px] flex-col sm:flex-row">
          <nav className="flex gap-1 border-b border-border p-3 sm:w-44 sm:flex-col sm:border-r sm:border-b-0">
            <TabButton
              active={tab === "general"}
              onClick={() => setTab("general")}
              icon={<SettingsIcon className="h-4 w-4" />}
              label="General"
            />
            <TabButton
              active={tab === "billing"}
              onClick={() => setTab("billing")}
              icon={<CreditCard className="h-4 w-4" />}
              label="Billing"
            />
          </nav>

          <div className="flex-1 p-5">
            {tab === "general" && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">General</h3>
                <p className="text-sm text-muted-foreground">
                  More preferences will appear here soon.
                </p>
              </div>
            )}

            {tab === "billing" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Billing</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review AI credit spend and usage analytics.
                  </p>
                </div>

                <Link
                  href="/settings/billing/credit-usage"
                  onClick={() => onOpenChange(false)}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start gap-3">
                    <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Usage analytics
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Open AI Credits Overview with per-execution history
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
