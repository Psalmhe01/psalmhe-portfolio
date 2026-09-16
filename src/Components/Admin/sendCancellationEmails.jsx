import emailjs from "@emailjs/browser";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminCancellationNoticeEmail, CancellationConfirmationEmail } from "./EmailTemplates";

export async function sendCancellationEmails(booking) {
  if (!booking) return;
  // Best effort only: the database cancellation has already committed.
  for (const [recipient, content] of [
    ["psalmhe@gmail.com", <AdminCancellationNoticeEmail {...booking} />],
    [booking.email, <CancellationConfirmationEmail {...booking} />],
  ]) {
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        { client_name: `${booking.firstName} ${booking.lastName}`, client_email: recipient, message_html: renderToStaticMarkup(content) },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );
    } catch {
      console.warn("Appointment cancelled; a cancellation email could not be delivered.");
    }
  }
}
