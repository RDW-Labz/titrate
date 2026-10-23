"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BACKUP_KEY, BACKUP_SNOOZE, backupAge, backupDue } from "@/lib/backup";
import { useStore } from "@/lib/store";

const SNOOZE_DAYS = 7;

/**
 * One line on Today when the backup file is missing or stale — the doses and photos exist nowhere else.
 * Quiet by default: nothing to say until there is data, and "Later" silences it for a week.
 */
export function BackupNudge() {
  const { compounds, doses } = useStore();
  // resolved once on mount: the clock and localStorage are outside React, so this is not derived state
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    const last = Number(localStorage.getItem(BACKUP_KEY)) || null;
    const snoozed = Number(localStorage.getItem(BACKUP_SNOOZE)) || null;
    if (backupDue(last, Date.now(), snoozed)) setTitle(last === null ? "No backup yet" : `Backup ${backupAge(last)}`);
  }, []);

  if (!title || (!compounds.length && !doses.length)) return null;

  return (
    <div className="enter mt-3 flex items-center gap-3 rounded-[22px] bg-card px-4 py-3 shadow-card">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold">{title}</p>
        <p className="text-[12px] text-muted">This device is the only copy.</p>
      </div>
      <Link href="/settings" className="press rounded-full bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent">
        Save
      </Link>
      <button
        className="press px-1 text-[12.5px] text-muted"
        onClick={() => {
          localStorage.setItem(BACKUP_SNOOZE, String(Date.now() + SNOOZE_DAYS * 86_400_000));
          setTitle(null);
        }}
      >
        Later
      </button>
    </div>
  );
}
