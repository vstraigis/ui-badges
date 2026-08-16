"use client";

interface OfflineNoticeProps {
  connected: boolean;
}

export function OfflineNotice({ connected }: OfflineNoticeProps) {
  if (connected) return null;

  return (
    <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
      Reconnecting to live results…
    </p>
  );
}
