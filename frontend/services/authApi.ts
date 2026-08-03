const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function requestOtp(phoneNumber: string) {
  const response = await fetch(`${API_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });

  if (!response.ok) {
    throw new Error("Failed to request OTP");
  }

  return response.json();
}

export async function verifyOtp(phoneNumber: string, code: string) {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber, code }),
  });

  if (!response.ok) {
    throw new Error("Invalid or expired code");
  }

  return response.json();
}
