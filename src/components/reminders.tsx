"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { dayKey, isDueOn } from "@/lib/schedule";
import { doseOn, steppedOn } from "@/lib/titration";

export const REMINDERS_KEY = "titrate.reminders";

export function remindersOn(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(REMINDERS_KEY) === "1";
}

/**
 * Due-dose notifications. They fire while a tab or the installed app is open —
 * real background push needs a server to send it, which this app does not have.
 */
export function Reminders() {
  const { compounds, doses } = useStore();

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!remindersOn() || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const tick = async () => {
      const now = new Date();
      const reg = await navigator.serviceWorker?.ready.catch(() => null);
      if (!reg) return;
      for (const c of compounds) {
        if (!isDueOn(c, doses, now)) continue;
        const key = `titrate.notified.${c.id}.${dayKey(now)}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "1");
        const step = steppedOn(c, now);
        reg.showNotification(`${c.name} is due${step ? " — new dose" : ""}`, {
          body: `${doseOn(c, now)} ${c.unit} — ${step ? "this step starts today, tap to log" : "tap to log"}`,
          tag: c.id,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        });
      }
    };

    void tick();
    const id = setInterval(() => void tick(), 60_000);
    return () => clearInterval(id);
  }, [compounds, doses]);

  return null;
}
