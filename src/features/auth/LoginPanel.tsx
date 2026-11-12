"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { AlertTriangle, FlaskConical } from "lucide-react";

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "החשבון כבר מקושר לשיטת התחברות אחרת.",
  AccessDenied: "הגישה נדחתה.",
  CredentialsSignin: "כתובת המייל אינה תקינה.",
  Configuration: "יש בעיה בהגדרות ההתחברות בשרת.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginPanel({
  callbackUrl,
  google,
  dev,
  signedInAs,
  notAdmin,
  error,
}: {
  callbackUrl: string;
  google: boolean;
  dev: boolean;
  signedInAs: string | null;
  notAdmin: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-8 space-y-4 text-right">
      {notAdmin && (
        <p className="flex gap-2 rounded-2xl bg-clay/10 px-4 py-3 text-[14px] text-clay">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          החשבון {signedInAs} אינו מוגדר כמנהלת. התחברו עם חשבון המנהלת.
        </p>
      )}
      {error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-[14px] text-clay">{ERRORS[error] ?? "ההתחברות נכשלה. נסו שוב."}</p>}

      {google ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            signIn("google", { callbackUrl });
          }}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-stone bg-white text-[16px] font-medium text-choco shadow-sm transition hover:border-choco hover:shadow-md disabled:opacity-60"
        >
          <GoogleIcon /> התחברות עם Google
        </button>
      ) : (
        <div className="rounded-2xl border border-dashed border-taupe p-4 text-[13.5px] leading-relaxed text-cocoa">
          <b className="text-choco">התחברות עם Google עדיין לא הוגדרה.</b> יש להוסיף את GOOGLE_CLIENT_ID ו-GOOGLE_CLIENT_SECRET לקובץ \u200E.env.local (ההוראות ב-README).
        </div>
      )}

      {signedInAs && !notAdmin && (
        <p className="text-center text-[13px] text-mocha">
          מחובר/ת כ-{signedInAs} ·{" "}
          <button type="button" className="underline" onClick={() => signOut({ callbackUrl: "/login" })}>
            התנתקות
          </button>
        </p>
      )}
      {notAdmin && (
        <button type="button" onClick={() => signOut({ callbackUrl: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` })} className="w-full text-center text-[14px] text-choco underline">
          התנתקות והתחברות עם חשבון אחר
        </button>
      )}

      {dev && (
        <form
          className="mt-6 rounded-2xl bg-cream p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            signIn("dev", { email, name: email.split("@")[0], callbackUrl });
          }}
        >
          <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-choco">
            <FlaskConical className="h-4 w-4 text-olive" /> כניסת בדיקה (רק במחשב הפיתוח)
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              dir="ltr"
              className="h-11 min-w-0 flex-1 rounded-xl border border-stone bg-ivory px-3 text-[14px] outline-none focus:border-choco"
            />
            <button type="submit" disabled={busy} className="h-11 rounded-xl bg-choco px-4 text-[14px] text-ivory disabled:opacity-50">
              כניסה
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-mocha">לבדיקת האתר לפני הגדרת Google. כבויה אוטומטית באתר החי.</p>
        </form>
      )}
    </div>
  );
}
