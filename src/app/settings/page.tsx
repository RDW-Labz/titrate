"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Btn, PageTitle } from "@/components/ui";
import { toast } from "@/components/toast";
import { REMINDERS_KEY } from "@/components/reminders";
import { EMPTY, actions, useStore } from "@/lib/store";
import type { State } from "@/lib/types";

const KEY = "titrate.v1";
const BACKUP = "titrate.v1.backup";

export default function SettingsPage() {
  const state = useStore();
  const [perm, setPerm] = useState<string>("default");
  const [on, setOn] = useState(false);
  const [bytes, setBytes] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    setOn(localStorage.getItem(REMINDERS_KEY) === "1");
    setBytes((localStorage.getItem(KEY) ?? "").length);
  }, [state]);

  function restore(raw: string | null, what: string) {
    if (!raw) {
      toast(`No ${what} found`);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<State>;
      actions.replace({ ...EMPTY, ...parsed, goals: { ...EMPTY.goals, ...parsed.goals } });
      toast(`Restored ${what}`);
    } catch {
      toast("That file didn't parse");
    }
  }

  return (
    <div className="pt-3">
      <Link href="/" className="press text-[14px] font-medium text-accent">
        ‹ Today
      </Link>
      <PageTitle meta="Reminders, backups, and what this app keeps on your device.">Settings</PageTitle>

      <section className="rounded-[24px] bg-card px-4 py-4 shadow-card">
        <p className="text-[15px] font-semibold">Reminders</p>
        <p className="mt-1 text-[13px] text-muted">
          A notification when a dose is due. Fires while the app is open or installed — there is no server, so
          nothing arrives after you close it.
        </p>
        <div className="mt-3 flex items-center gap-2">
          {perm === "unsupported" ? (
            <span className="text-[13px] text-muted">This browser can’t show notifications.</span>
          ) : on && perm === "granted" ? (
            <>
              <Btn
                variant="quiet"
                onClick={() => {
                  localStorage.removeItem(REMINDERS_KEY);
                  setOn(false);
                  toast("Reminders off");
                }}
              >
                Turn off
              </Btn>
              <span className="text-[13px] text-muted">On · permission granted</span>
            </>
          ) : (
            <>
              <Btn
                onClick={async () => {
                  const p = await Notification.requestPermission();
                  setPerm(p);
                  if (p === "granted") {
                    localStorage.setItem(REMINDERS_KEY, "1");
                    setOn(true);
                    toast("Reminders on");
                  } else {
                    toast("Notifications are blocked in this browser");
                  }
                }}
              >
                Enable reminders
              </Btn>
              {perm === "denied" ? (
                <span className="text-[13px] text-alert">Blocked — allow notifications in site settings.</span>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <p className="text-[15px] font-semibold">Your data</p>
        <p className="num mt-1 text-[12.5px] text-muted">
          {state.compounds.length} peptides · {state.doses.length} doses · {state.foods.length} meals ·{" "}
          {(bytes / 1024).toFixed(1)} KB on this device
        </p>
        <div className="mt-3 grid gap-2">
          <Btn
            variant="quiet"
            onClick={() => {
              const raw = localStorage.getItem(KEY) ?? "{}";
              const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `titrate-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast("Backup downloaded");
            }}
          >
            Download a backup
          </Btn>
          <Btn variant="line" onClick={() => fileRef.current?.click()}>
            Restore from a file
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              restore(await file.text(), "backup");
              e.target.value = "";
            }}
          />
          <Btn variant="line" onClick={() => restore(localStorage.getItem(BACKUP), "last snapshot")}>
            Undo the last change
          </Btn>
        </div>
        <p className="mt-2 text-[12px] text-muted">
          Every save also keeps one previous snapshot on this device, so a bad edit is one tap away.
        </p>
      </section>

      <section className="mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <p className="text-[15px] font-semibold">Start over</p>
        <div className="mt-3 grid gap-2">
          <Btn variant="line" onClick={() => actions.seed()}>
            Load sample data
          </Btn>
          <Btn
            variant="line"
            className="!text-alert"
            onClick={() => {
              if (confirm("Delete every peptide, dose and meal on this device? The last snapshot is kept.")) {
                actions.reset();
                toast("Cleared — undo is in Your data");
              }
            }}
          >
            Delete everything
          </Btn>
        </div>
      </section>

      <p className="mt-4 px-1 text-[12px] leading-relaxed text-muted">
        Titrate stores everything in this browser. No account, no server, nothing leaves the device unless you
        download it. Tracking only — not medical advice.
      </p>
    </div>
  );
}
