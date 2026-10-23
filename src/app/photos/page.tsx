"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Btn, PageTitle, useDialog } from "@/components/ui";
import { toast } from "@/components/toast";
import { addPhoto, deletePhoto, listPhotos, shrink, type Photo } from "@/lib/photos";

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const panel = useDialog(open !== null, () => setOpen(null));

  useEffect(() => {
    listPhotos()
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, []);

  async function add(file: File | undefined) {
    if (!file) return;
    try {
      await addPhoto(await shrink(file));
      setPhotos(await listPhotos());
      toast("Photo saved on this device");
    } catch {
      toast("That image didn't load");
    }
  }

  return (
    <div className="pt-3">
      <Link href="/food" className="press -my-1 inline-block py-1.5 text-[14px] font-medium text-accent">
        ‹ Food
      </Link>
      <PageTitle meta="Stored on this device only — nothing is uploaded.">Progress photos</PageTitle>

      {photos === null ? (
        <p className="px-1 text-[13px] text-muted">Loading…</p>
      ) : photos.length === 0 ? (
        <div className="rounded-[24px] bg-card px-5 py-8 text-center shadow-card">
          <p className="text-[16px] font-semibold">No photos yet</p>
          <p className="mx-auto mt-1.5 max-w-[30ch] text-[13.5px] text-muted">
            Same light, same spot, once a week — the change is easier to see than the scale.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpen(p.id)}
              className="press relative aspect-[3/4] overflow-hidden rounded-[16px] bg-card shadow-card"
              aria-label={`Photo from ${p.at.slice(0, 10)}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.data} alt={`Progress on ${p.at.slice(0, 10)}`} className="size-full object-cover" />
              <span className="num absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 pt-4 pb-1 text-[10.5px] text-white">
                {new Date(p.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3">
        <label className="press flex w-full cursor-pointer items-center justify-center rounded-[20px] bg-card py-3.5 text-[14.5px] font-semibold text-accent shadow-card">
          Add a photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              add(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {open ? (
        <div
          ref={panel}
          tabIndex={-1}
          className="fixed inset-0 z-40 flex flex-col bg-ink/90 p-4 outline-none"
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
        >
          <div className="flex items-center justify-between text-white">
            <span className="num text-[13px]">{new Date(photos?.find((p) => p.id === open)?.at ?? "").toLocaleDateString()}</span>
            <button onClick={() => setOpen(null)} className="press px-2 py-1 text-[15px] font-semibold">
              Close
            </button>
          </div>
          <div className="mt-3 flex-1 overflow-hidden rounded-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos?.find((p) => p.id === open)?.data} alt="" className="size-full object-contain" />
          </div>
          <Btn
            variant="line"
            className="mt-3 !border-white/30 !text-white"
            onClick={async () => {
              const gone = photos?.find((p) => p.id === open);
              await deletePhoto(open);
              setPhotos(await listPhotos());
              setOpen(null);
              if (!gone) return;
              toast("Photo deleted", {
                label: "Undo",
                run: async () => {
                  await addPhoto(gone.data, new Date(gone.at));
                  setPhotos(await listPhotos());
                },
              });
            }}
          >
            Delete this photo
          </Btn>
        </div>
      ) : null}
    </div>
  );
}
