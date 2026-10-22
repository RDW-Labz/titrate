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
  const [perm, setPerm] = useState("default");
  const [on, setOn] = useState(false);
  const [kb, setKb] = useState("0");
  const [installed, setInstalled] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    setOn(localStorage.getItem(REMINDERS_KEY) === "1");
    setKb(((localStorage.getItem(KEY) ?? "").length / 1024).toFixed(1));
    // shortcut: iOS uses navigator.standalone, everyone else display-mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
  }, [state]);

  function restore(raw: string | null, label: string) {
    if (!raw) return toast("Nothing saved yet");
    try {
      const parsed = JSON.parse(raw) as Partial<State>;
      actions.replace({ ...EMPTY, ...parsed, goals: { ...EMPTY.goals, ...parsed.goals } });
      toast(`Restored ${label}`);
    } catch {
      toast("That file didn't open");
    }
  }

  return (
    <div className="pt-3">
      <Link href="/" className="press -my-1 inline-block py-1.5 text-[14px] font-medium text-accent">
        ‹ Today
      </Link>
      <PageTitle>Settings</PageTitle>

      <section className="rounded-[24px] bg-card px-4 py-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold">Reminders</p>
          {perm === "unsupported" ? (
            <span className="text-[12.5px] text-muted">Not supported</span>
          ) : on && perm === "granted" ? (
            <Btn
              size="sm"
              variant="quiet"
              onClick={() => {
                localStorage.removeItem(REMINDERS_KEY);
                setOn(false);
                toast("Reminders off");
              }}
            >
              On
            </Btn>
          ) : (
            <Btn
              size="sm"
              onClick={async () => {
                const p = await Notification.requestPermission();
                setPerm(p);
                if (p === "granted") {
                  localStorage.setItem(REMINDERS_KEY, "1");
                  setOn(true);
                  toast("Reminders on");
                } else toast("Blocked in this browser");
              }}
            >
              Enable
            </Btn>
          )}
        </div>
        <p className="mt-1 text-[12px] text-muted">A ping when a dose is due, while the app is open.</p>
      </section>

      <section className="mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <p className="text-[15px] font-semibold">Backup</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn
            size="sm"
            variant="quiet"
            onClick={() => {
              const url = URL.createObjectURL(new Blob([localStorage.getItem(KEY) ?? "{}"], { type: "application/json" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `titrate-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast("Saved a copy");
            }}
          >
            Download
          </Btn>
          <Btn
            size="sm"
            variant="line"
            onClick={() => {
              const rows = [
                ["date", "time", "compound", "dose", "unit", "units_drawn", "site", "skipped"],
                ...state.doses
                  .slice()
                  .sort((a, b) => +new Date(a.at) - +new Date(b.at))
                  .map((d) => {
                    const at = new Date(d.at);
                    const c = state.compounds.find((x) => x.id === d.compoundId);
                    return [
                      at.toLocaleDateString("en-CA"),
                      at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                      c?.name ?? "",
                      String(d.dose),
                      d.unit,
                      d.units ? String(d.units) : "",
                      d.site ?? "",
                      d.skipped ? "yes" : "",
                    ];
                  }),
              ];
              const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `titrate-doses-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast("Doses exported");
            }}
          >
            Doses CSV
          </Btn>
          <Btn size="sm" variant="line" onClick={() => fileRef.current?.click()}>
            Restore
          </Btn>
          <Btn size="sm" variant="line" onClick={() => restore(localStorage.getItem(BACKUP), "last change")}>
            Undo last change
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
        </div>
        <p className="num mt-1 text-[12px] text-muted">
          {state.compounds.length} peptides · {state.doses.length} doses · {kb} KB on this device
        </p>
      </section>

      <section className="mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold">Summary</p>
            <p className="mt-1 text-[12px] text-muted">A one-page view of your protocol to print or show a doctor.</p>
          </div>
          <Link
            href="/summary"
            className="press shrink-0 rounded-xl bg-accent-soft px-3 py-2 text-[13.5px] font-semibold text-accent"
          >
            Open
          </Link>
        </div>
      </section>

      {!installed ? (
        <section className="mt-3 rounded-[24px] bg-accent-soft px-4 py-4">
          <p className="text-[15px] font-semibold text-accent">Add it to your home screen</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-accent/85">
            {/iPhone|iPad|iPod/.test(navigator.userAgent)
              ? "Tap Share, then Add to Home Screen — it opens full screen and works offline."
              : "Open the browser menu and choose Install app — it opens full screen and works offline."}
          </p>
        </section>
      ) : null}

      <section className="mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <p className="text-[15px] font-semibold">Start over</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn size="sm" variant="line" onClick={() => actions.seed()}>
            Load sample
          </Btn>
          <Btn
            size="sm"
            variant="line"
            className="!text-alert"
            onClick={() => {
              if (confirm("Delete everything on this device?")) {
                actions.reset();
                toast("Deleted — undo is under Backup");
              }
            }}
          >
            Delete everything
          </Btn>
        </div>
      </section>

      <p className="mt-4 px-1 text-[12px] text-muted">
        Everything stays on this device. Tracking only, not medical advice.
      </p>
    </div>
  );
}
