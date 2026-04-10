"use client";

type Props = {
  text: string | null;
};

export function PauseToast({ text }: Props) {
  if (!text) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6">
      <div className="rounded-full border border-white/30 bg-black/60 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur">
        {text}
      </div>
    </div>
  );
}

