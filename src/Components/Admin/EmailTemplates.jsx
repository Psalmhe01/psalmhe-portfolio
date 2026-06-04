import React from "react";

const styles = {
  body: {
    backgroundColor: "#f0efeb",
    fontFamily: "'DM Sans', sans-serif",
    padding: "48px 16px",
    color: "#111",
  },
  wrapper: {
    maxWidth: "560px",
    margin: "0 auto",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
  },
  header: {
    borderBottom: "1px solid #111",
    padding: "40px 48px 32px",
  },
  brand: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "13px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    margin: "0 0 36px 0",
    color: "#111",
  },
  statusPill: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: "500",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "5px 12px",
    border: "1px solid #111",
    marginBottom: "20px",
  },
  confirmedPill: {
    backgroundColor: "#111",
    color: "#fff",
  },
  deniedPill: {
    backgroundColor: "#f0efeb",
    color: "#111",
  },
  headline: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "34px",
    lineHeight: "1.15",
    margin: "0 0 12px 0",
    color: "#111",
  },
  subline: {
    fontSize: "14px",
    color: "#555555",
    lineHeight: "1.6",
    margin: 0,
  },
  content: {
    padding: "36px 48px",
    backgroundColor: "#ffffff",
  },
  detailsBlock: {
    border: "1px solid #e0e0e0",
    marginBottom: "32px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: "#ffffff",
  },
  label: {
    fontSize: "11px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#888888",
  },
  value: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#111111",
  },
  cta: {
    display: "block",
    textAlign: "center",
    background: "#111111",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "500",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "16px 32px",
    marginTop: "32px",
  },
  footer: {
    borderTop: "1px solid #e0e0e0",
    padding: "24px 48px",
    fontSize: "12px",
    color: "#999999",
    backgroundColor: "#ffffff",
  },
};

// Injected into <head> of the email HTML via a <style> tag.
// - `color-scheme: light` tells supporting clients (Apple Mail, Outlook) to
//   render only in light mode.
// - The `[data-ogsc]` and `[data-ogsb]` selectors override Gmail Android's
//   dark mode color injection on text and background respectively.
// - `.keep-light` with `!important` locks our key colors against any client
//   that tries to swap them.
const darkModeOverrideCSS = `
  :root { color-scheme: light; }
  .email-root {
    color-scheme: light !important;
    background-color: #f0efeb !important;
  }
  .email-card {
    background-color: #ffffff !important;
  }
  .email-header {
    background-color: #ffffff !important;
  }
  .keep-white { background-color: #ffffff !important; color: #111111 !important; }
  .keep-dark  { background-color: #111111 !important; color: #ffffff !important; }
  .keep-cream { background-color: #f0efeb !important; }
  .text-dark  { color: #111111 !important; }
  .text-muted { color: #555555 !important; }
  .text-label { color: #888888 !important; }
  .text-white { color: #ffffff !important; }

  /* Gmail Android dark mode overrides */
  [data-ogsc] .text-dark  { color: #111111 !important; }
  [data-ogsc] .text-muted { color: #555555 !important; }
  [data-ogsc] .text-label { color: #888888 !important; }
  [data-ogsc] .text-white { color: #ffffff !important; }
  [data-ogsb] .keep-white { background-color: #ffffff !important; }
  [data-ogsb] .keep-dark  { background-color: #111111 !important; }
  [data-ogsb] .keep-cream { background-color: #f0efeb !important; }
`;

const EmailWrapper = ({ children }) => (
  <html lang="en">
    <head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: darkModeOverrideCSS }} />
    </head>
    <body className="email-root keep-cream" style={styles.body}>
      <div className="email-card" style={styles.wrapper}>
        {children}
        <div className="keep-white" style={styles.footer}>
          <table width="100%">
            <tbody>
              <tr>
                <td
                  className="text-dark"
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#111111",
                  }}
                >
                  Psalmhe Photography
                </td>
                <td
                  className="text-label"
                  style={{ textAlign: "right", color: "#888888" }}
                >
                  psalmhe-portfolio.vercel.app
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </body>
  </html>
);

export const ConfirmationEmail = ({
  id,
  firstName,
  lastName,
  bookingDate,
  bookingTime,
  occasion,
}) => (
  <EmailWrapper>
    <div
      className="email-header keep-white"
      style={{ ...styles.header, backgroundColor: "#ffffff" }}
    >
      <p className="text-dark" style={styles.brand}>
        Psalmhe Photography
      </p>
      <div
        className="keep-dark text-white"
        style={{ ...styles.statusPill, ...styles.confirmedPill }}
      >
        Confirmed
      </div>
      <h1 className="text-dark" style={styles.headline}>
        Your session is confirmed.
      </h1>
      <p className="text-muted" style={styles.subline}>
        We're looking forward to working with you.
      </p>
    </div>

    <div className="keep-white" style={styles.content}>
      <p className="text-dark" style={{ color: "#111111" }}>
        Hi {firstName},
      </p>
      <p
        className="text-muted"
        style={{ lineHeight: "1.7", margin: "20px 0", color: "#444444" }}
      >
        Great news — your photography session has been confirmed. Here's a
        summary of what's scheduled.
      </p>

      <div style={styles.detailsBlock}>
        {[
          ["Date", bookingDate],
          ["Time", bookingTime],
          ["Occasion", occasion || "Photography Session"],
          ["Name", `${firstName} ${lastName}`],
        ].map(([label, value], i, arr) => (
          <div
            key={label}
            className="keep-white"
            style={{
              ...styles.row,
              borderBottom: i === arr.length - 1 ? "none" : "1px solid #e0e0e0",
            }}
          >
            <span className="text-label" style={styles.label}>
              {label}
            </span>
            <span className="text-dark" style={styles.value}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <p
        className="text-muted"
        style={{ fontSize: "14px", lineHeight: "1.75", color: "#444444" }}
      >
        Please arrive a few minutes early so we have time to get settled. If
        anything changes, feel free to reach out.
      </p>
      <a
        href="mailto:psalmhe@gmail.com"
        className="keep-dark text-white"
        style={styles.cta}
      >
        Get in touch
      </a>

      <p
        style={{
          fontSize: "12px",
          color: "#888888",
          textAlign: "center",
          marginTop: "48px",
          marginBottom: "8px",
        }}
      >
        Need to change your plans?
      </p>
      <a
        href={`https://psalmhe-portfolio.vercel.app/cancel-booking/${encodeURIComponent(id)}`}
        className="text-dark"
        style={{ ...styles.cta, background: "transparent", color: "#111111", border: "1px solid #111111", marginTop: "0" }}
      >
        Cancel Appointment
      </a>
    </div>
  </EmailWrapper>
);

export const CancellationConfirmationEmail = ({
  firstName,
  bookingDate,
  bookingTime,
}) => (
  <EmailWrapper>
    <div
      className="email-header keep-white"
      style={{ ...styles.header, backgroundColor: "#ffffff" }}
    >
      <p className="text-dark" style={styles.brand}>
        Psalmhe Photography
      </p>
      <div
        className="keep-cream text-dark"
        style={{ ...styles.statusPill, ...styles.deniedPill }}
      >
        Cancelled
      </div>
      <h1 className="text-dark" style={styles.headline}>
        Your cancellation is confirmed.
      </h1>
      <p className="text-muted" style={styles.subline}>
        We're sorry you couldn't make it.
      </p>
    </div>

    <div className="keep-white" style={styles.content}>
      <p className="text-dark" style={{ color: "#111111" }}>
        Hi {firstName},
      </p>
      <p
        className="text-muted"
        style={{ lineHeight: "1.7", margin: "20px 0", color: "#444444" }}
      >
        This email confirms that your session for <strong>{bookingDate}</strong> at <strong>{bookingTime}</strong> has been cancelled.
      </p>

      <p
        className="text-muted"
        style={{ fontSize: "14px", lineHeight: "1.75", color: "#444444" }}
      >
        Plans change, and that's okay! If you'd like to reschedule for a different time, I'd love to have you back.
      </p>
      <a
        href="https://psalmhe-portfolio.vercel.app/book"
        className="keep-dark text-white"
        style={styles.cta}
      >
        Schedule New Appointment
      </a>
    </div>
  </EmailWrapper>
);

export const AdminCancellationNoticeEmail = ({
  firstName,
  lastName,
  email,
  bookingDate,
  bookingTime,
  occasion,
}) => (
  <EmailWrapper>
    <div
      className="email-header keep-white"
      style={{ ...styles.header, backgroundColor: "#ffffff" }}
    >
      <p className="text-dark" style={styles.brand}>
        Admin Notification
      </p>
      <div
        className="keep-dark text-white"
        style={{ ...styles.statusPill, ...styles.confirmedPill, backgroundColor: "#d0021b" }}
      >
        Notice: Cancelled
      </div>
      <h1 className="text-dark" style={styles.headline}>
        A client has cancelled.
      </h1>
    </div>

    <div className="keep-white" style={styles.content}>
      <div style={styles.detailsBlock}>
        {[
          ["Client", `${firstName} ${lastName}`],
          ["Email", email],
          ["Date", bookingDate],
          ["Time", bookingTime],
          ["Occasion", occasion || "—"],
        ].map(([label, value], i, arr) => (
          <div
            key={label}
            className="keep-white"
            style={{
              ...styles.row,
              borderBottom: i === arr.length - 1 ? "none" : "1px solid #e0e0e0",
            }}
          >
            <span className="text-label" style={styles.label}>
              {label}
            </span>
            <span className="text-dark" style={styles.value}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <p
        className="text-muted"
        style={{ ...styles.subline, textAlign: "center", marginTop: "24px" }}
      >
        This slot is now open in the availability calendar.
      </p>
    </div>
  </EmailWrapper>
);

export const DenialEmail = ({ firstName, bookingDate, bookingTime }) => (
  <EmailWrapper>
    <div
      className="email-header keep-white"
      style={{ ...styles.header, backgroundColor: "#ffffff" }}
    >
      <p className="text-dark" style={styles.brand}>
        Psalmhe Photography
      </p>
      <div
        className="keep-cream text-dark"
        style={{ ...styles.statusPill, ...styles.deniedPill }}
      >
        Unavailable
      </div>
      <h1 className="text-dark" style={styles.headline}>
        This slot isn't available.
      </h1>
      <p className="text-muted" style={styles.subline}>
        But we'd still love to work with you.
      </p>
    </div>

    <div className="keep-white" style={styles.content}>
      <p className="text-dark" style={{ color: "#111111" }}>
        Hi {firstName},
      </p>
      <p
        className="text-muted"
        style={{ lineHeight: "1.7", margin: "20px 0", color: "#444444" }}
      >
        Thank you for reaching out. Unfortunately, the time you requested is no
        longer available — it looks like someone else got there just before you.
      </p>

      <div style={styles.detailsBlock}>
        {[
          ["Requested Date", bookingDate],
          ["Requested Time", bookingTime],
        ].map(([label, value]) => (
          <div key={label} className="keep-white" style={styles.row}>
            <span className="text-label" style={styles.label}>
              {label}
            </span>
            <span className="text-dark" style={styles.value}>
              {value}
            </span>
          </div>
        ))}
        <div
          className="keep-white"
          style={{ ...styles.row, borderBottom: "none" }}
        >
          <span className="text-label" style={styles.label}>
            Status
          </span>
          <span
            className="text-label"
            style={{ ...styles.value, color: "#888888" }}
          >
            Unavailable
          </span>
        </div>
      </div>

      <p
        className="text-muted"
        style={{ fontSize: "14px", lineHeight: "1.75", color: "#444444" }}
      >
        I'd love to find a time that works for you. Head back to the booking
        page to choose a different slot.
      </p>
      <a
        href="https://psalmhe-portfolio.vercel.app/book"
        className="text-dark"
        style={{
          ...styles.cta,
          background: "#f0efeb",
          color: "#111111",
          border: "1px solid #111111",
        }}
      >
        Choose another time
      </a>
    </div>
  </EmailWrapper>
);
