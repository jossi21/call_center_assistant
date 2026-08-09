import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_handoff_email(staff_email: str, reason: str, user_contact: str, conversation_summary: str) -> bool:
    subject = f"New Support Handoff — {reason[:60]}"

    plain_body = f"""A conversation has been assigned to you.

Reason: {reason}
User contact: {user_contact}

Recent conversation summary:
{conversation_summary}

Please open the admin dashboard to respond.
"""

    summary_html = "".join(
        f'<div style="padding:10px 0;border-bottom:1px solid #f1f1f1;font-size:14px;color:#374151;">{line}</div>'
        for line in conversation_summary.split("\n") if line.strip()
    )

    html_body = f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f3f4f6; padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <div style="background:#4f46e5;padding:28px 32px;">
          <div style="color:#e0e7ff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">
            Support Handoff
          </div>
          <div style="color:#ffffff;font-size:24px;font-weight:700;margin-top:6px;">
            New Conversation Assigned
          </div>
        </div>

        <div style="padding:28px 32px;">
          <p style="font-size:14px;color:#374151;margin:0 0 20px 0;">
            A customer conversation has been assigned to you and needs a response.
          </p>

          <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
            <div style="font-size:11px;font-weight:600;letter-spacing:0.5px;color:#4f46e5;text-transform:uppercase;">Reason</div>
            <div style="font-size:16px;color:#1e1b4b;font-weight:600;margin-top:4px;">{reason}</div>
          </div>

          <div style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
            <div style="background:#f3f4f6;padding:12px 20px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
              Details
            </div>
            <div style="padding:4px 20px;">
              <div style="padding:10px 0;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:14px;">
                <span style="color:#6b7280;">User Contact</span>
                <span style="color:#111827;font-weight:600;">{user_contact}</span>
              </div>
            </div>
          </div>

          <div style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:28px;">
            <div style="background:#f3f4f6;padding:12px 20px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
              Recent Conversation
            </div>
            <div style="padding:4px 20px;">
              {summary_html}
            </div>
          </div>

          <a href="#" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            Open Admin Dashboard
          </a>
        </div>

      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.from_email
    msg["To"] = staff_email
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.from_email, [staff_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send handoff email: {e}")
        return False