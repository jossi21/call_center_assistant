"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/services/authApi";
import { Loader2, ArrowLeft } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoVerified = useRef(false);

  const handleVerifyOtp = useCallback(async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(phone, fullCode);
      localStorage.setItem("app_access_token", res.access_token);

      if (res.is_admin) {
        router.push("/admin");
      } else if (res.is_staff) {
        router.push("/staff");
      } else {
        setError("This account isn't set up for admin or staff access.");
      }
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }, [code, phone, loading, router]);

  const startTimer = useCallback(() => {
    setTimeLeft(120);
    setIsResendDisabled(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Focus input when step changes
  useEffect(() => {
    if (step === "code") {
      inputRefs.current[0]?.focus();
      const timer = setTimeout(() => {
        startTimer();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [step, startTimer]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 6 && step === "code" && !hasAutoVerified.current) {
      hasAutoVerified.current = true;
      handleVerifyOtp();
    }
    if (fullCode.length === 0) {
      hasAutoVerified.current = false;
    }
  }, [code, step, handleVerifyOtp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "").slice(0, 1);
    setCode(newCode);
    hasAutoVerified.current = false;

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Enter key support - trigger verification
    if (e.key === "Enter") {
      e.preventDefault();
      const fullCode = code.join("");
      if (fullCode.length === 6) {
        handleVerifyOtp();
      } else {
        setError("Please enter the complete 6-digit code.");
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    hasAutoVerified.current = false;
    const nextEmptyIndex = newCode.findIndex((c) => c === "");
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  async function handleRequestOtp() {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setStep("code");
      setCode(Array(6).fill(""));
      hasAutoVerified.current = false;
    } catch {
      setError("Invalid number. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (isResendDisabled) return;
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setCode(Array(6).fill(""));
      hasAutoVerified.current = false;
      startTimer();
    } catch {
      setError("Couldn't send code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 flex flex-col gap-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === "phone"
              ? "Sign in to your admin/staff account"
              : "Enter the verification code"}
          </p>
        </div>

        {step === "phone" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                placeholder="0925553491"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && phone) {
                    handleRequestOtp();
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              disabled={loading || !phone}
              onClick={handleRequestOtp}
              className="bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Sending..." : "Send Code"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-3 text-center">
                Enter the 6-digit code sent to {phone}
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 bg-slate-800 border border-slate-700 rounded-lg text-center text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setStep("phone")}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <div className="flex items-center gap-3">
                  {isResendDisabled ? (
                    <span className="text-sm text-slate-500">
                      Resend in {formatTime(timeLeft)}
                    </span>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 size={20} className="animate-spin text-emerald-400" />
                <span className="ml-2 text-sm text-slate-400">
                  Verifying...
                </span>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="rounded-lg px-4 py-2.5">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
