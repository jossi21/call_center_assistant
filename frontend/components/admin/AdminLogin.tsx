"use client";

import { useState } from "react";
import { requestOtp, verifyOtp } from "@/services/authApi";

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp() {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setStep("code");
    } catch {
      setError("Couldn't send code. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code);
      localStorage.setItem("admin_access_token", res.access_token);
      onLogin();
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white rounded-2xl shadow-lg border border-zinc-100 p-6 flex flex-col gap-3">
      <span className="text-lg font-semibold text-zinc-900">Admin Sign In</span>

      {step === "phone" && (
        <>
          <input
            placeholder="Admin phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none text-zinc-900"
          />
          <button
            disabled={loading || !phone}
            onClick={handleRequestOtp}
            className="bg-indigo-500 text-white rounded-lg py-2.5 text-sm disabled:opacity-50"
          >
            Send code
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <input
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none text-zinc-900"
          />
          <button
            disabled={loading || !code}
            onClick={handleVerifyOtp}
            className="bg-indigo-500 text-white rounded-lg py-2.5 text-sm disabled:opacity-50"
          >
            Verify
          </button>
        </>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
