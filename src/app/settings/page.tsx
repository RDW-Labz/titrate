"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Btn, PageTitle } from "@/components/ui";
import { toast } from "@/components/toast";
import { REMINDERS_KEY } from "@/components/reminders";
import { EMPTY, actions, useStore } from "@/lib/store";
import { dosesIcs } from "@/lib/ics";
import { addPhoto, deletePhoto, listPhotos } from "@/lib/photos";
import { BACKUP_KEY } from "@/lib/backup";
import { dosesCsv } from "@/lib/export";
import type { State } from "@/lib/types";

const KEY = "titrate.v1";
const BACKUP = "titrate.v1.backup";

export default function SettingsPage() {
  const state = useStore();
  const [perm, setPerm] = useState("default");
  const [on, setOn] = useState(false);
  const [kb, setKb] = useState("0");
  const [photos, setPhotos] = useState(0);
  const [installed, setInstalled] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    listPhotos()
      .then((p) => setPhotos(p.length))
      .catch(() => undefined);
  }, []);

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

  async function restore(raw: string | null, label: string) {
    if (!raw) return toast("Nothing saved yet");
    // a restore is the one action that overwrites everything, so keep the way back before touching anything
    const before = state;
    const beforePhotos = await listPhotos().catch(() => []);
    try {
      const parsed = JSON.parse(raw) as Partial<State> & { photos?: { at: string; data: string }[] };
      const { photos, ...next } = parsed;
      actions.replace({ ...EMPTY, ...next, goals: { ...EMPTY.goals, ...parsed.goals } });
      const added: string[] = [];
      if (photos?.length) {
        const have = new Set(beforePhotos.map((p) => p.data));
        const fresh = photos.filter((p) => !have.has(p.data));
        added.push(...(await Promise.all(fresh.map((p) => addPhoto(p.data, new Date(p.at)).catch(() => "")))));
        setPhotos(beforePhotos.length + fresh.length);
      }
      toast(`Restored ${label}`, {
        label: "Undo",
        run: async () => {
          await Promise.all(added.filter(Boolean).map((id) => deletePhoto(id).catch(() => undefined)));
          actions.replace(before);
          setPhotos(beforePhotos.length);
        },
      });
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
            onClick={async () => {
              const shots = await listPhotos().catch(() => []);
              let body = localStorage.getItem(KEY) ?? "{}";
              if (shots.length) {
                try {
                  body = JSON.stringify({ ...JSON.parse(body), photos: shots.map(({ at, data }) => ({ at, data })) });
                } catch {
                  // a damaged store still exports what it has
                }
              }
              const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `titrate-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              localStorage.setItem(BACKUP_KEY, String(Date.now()));
              toast(shots.length ? `Saved a copy with ${shots.length} photo${shots.length === 1 ? "" : "s"}` : "Saved a copy");
            }}
          >
            Download
          </Btn>
          <Btn
            size="sm"
            variant="line"
            onClick={() => {
              const csv = dosesCsv(state.doses, state.compounds);
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
          <Btn
            size="sm"
            variant="line"
            onClick={() => {
              const ics = dosesIcs(state.compounds, new Date());
              if (!ics.includes("BEGIN:VEVENT")) return toast("Nothing scheduled to export");
              const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = "titrate-schedule.ics";
              a.click();
              URL.revokeObjectURL(url);
              toast("8 weeks of doses, ready to add to your calendar");
            }}
          >
            Calendar
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
          {photos ? ` · ${photos} photo${photos === 1 ? "" : "s"}` : ""}
          <br />
          Calendar exports the next 8 weeks as .ics — Apple and Google Calendar both read it.
        </p>
      </section>

      <section className="mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold">Type it</p>
            <p className="mt-1 text-[12px] text-muted">Log a dose in a sentence instead of tapping through fields.</p>
          </div>
          <Link href="/assistant" className="press shrink-0 rounded-xl bg-accent-soft px-3 py-2 text-[13.5px] font-semibold text-accent">
            Open
          </Link>
        </div>
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
            onClick={async () => {
              if (!confirm("Delete everything on this device?")) return;
              const shots = await listPhotos().catch(() => []);
              await Promise.all(shots.map((p) => deletePhoto(p.id).catch(() => undefined)));
              actions.reset();
              setPhotos(0);
              toast(shots.length ? "Deleted — the photos are gone for good" : "Deleted — undo is under Backup");
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
