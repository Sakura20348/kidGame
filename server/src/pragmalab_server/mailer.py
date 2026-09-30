"""Sends email (teacher sign-in codes) through SMTP, when it is set up in .env."""

import smtplib
import ssl
from email.message import EmailMessage

from pragmalab_server.config import settings


def email_enabled() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def send_code_email(to: str, name: str, code: str) -> None:
    """Raises on failure so the caller can tell the teacher."""
    msg = EmailMessage()
    msg["Subject"] = f"Your LittleReaderLab code: {code}"
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg.set_content(
        f"Hi {name or 'there'},\n\n"
        f"Your LittleReaderLab sign-in code is: {code}\n\n"
        f"It works for {settings.code_ttl_minutes} minutes. If you didn't try to sign in, you can ignore this email.\n\n"
        f"— LittleReaderLab\n{settings.app_url}\n"
    )
    if settings.smtp_port == 465:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=ssl.create_default_context(), timeout=15) as s:
            _login_and_send(s, msg)
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as s:
            if settings.smtp_starttls:
                s.starttls(context=ssl.create_default_context())
            _login_and_send(s, msg)


def _login_and_send(s: smtplib.SMTP, msg: EmailMessage) -> None:
    if settings.smtp_user:
        s.login(settings.smtp_user, settings.smtp_password)
    s.send_message(msg)
