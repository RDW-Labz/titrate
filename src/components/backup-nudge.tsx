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
  const [last, setLast] = useState<number | null>(null);
  const [snoozed, setSnoozed] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stamp = Number(localStorage.getItem(BACKUP_KEY)) || null;
    const until = Number(localStorage.getItem(BACKUP_SNOOZE)) || null;
    setLast(stamp);
    setSnoozed(until);
    setReady(true);
  }, []);

  if (!ready || (!compounds.length && !doses.length) || !backupDue(last, Date.now(), snoozed)) return null;

  return (
    <div className="enter mt-3 flex items-center gap-3 rounded-[22px] bg-card px-4 py-3 shadow-card">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold">{last === null ? "No backup yet" : `Backup ${backupAge(last)}`}</p>
        <p className="text-[12px] text-muted">This device is the only copy.</p>
      </div>
      <Link href="/settings" className="press rounded-full bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent">
        Save
      </Link>
      <button
        className="press px-1 text-[12.5px] text-muted"
        onClick={() => {
          localStorage.setItem(BACKUP_SNOOZE, String(Date.now() + SNOOZE_DAYS * 86_400_000));
          setSnoozed(Date.now() + SNOOZE_DAYS * 86_400_000);
        }}
      >
        Later
      </button>
    </div>
  );
}
