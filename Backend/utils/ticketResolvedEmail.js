export const ticketResolvedEmail = (ticket = {}) => {
  const priorityColors = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444",
    Critical: "#dc2626",
  };

  return `
  <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
    <div style="max-width:650px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#0f766e;padding:20px;color:white;">
        <h2 style="margin:0;">✅ Ticket Resolved</h2>
        <p style="margin-top:5px;font-size:14px;">Your support ticket has been marked as resolved by our team.</p>
      </div>
      <div style="padding:25px;">
        <p style="font-size:15px;color:#111827;">Hi <b>${ticket.userEmail || "User"}</b>,</p>
        <p style="font-size:14px;color:#4b5563;line-height:1.6;">
          Good news! Your ticket has been resolved by the support team.
          If you still need help, you can reopen the ticket or create a new request.
        </p>
        <div style="margin-top:25px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <div style="background:#f9fafb;padding:12px 18px;border-bottom:1px solid #e5e7eb;">
            <h3 style="margin:0;font-size:16px;color:#111827;">Ticket Summary</h3>
          </div>
          <div style="padding:18px;">
            <p style="margin:10px 0;"><b>Ticket ID:</b> ${ticket._id || "-"}</p>
            <p style="margin:10px 0;"><b>Title:</b> ${ticket.title || "-"}</p>
            <p style="margin:10px 0;"><b>Status:</b> ${ticket.status || "Resolved"}</p>
            <p style="margin:10px 0;"><b>Resolved At:</b> ${new Date(ticket.resolvedAt || Date.now()).toLocaleString()}</p>
            <p style="margin:10px 0;"><b>Priority:</b>
              <span style="background:${priorityColors[ticket.priority] || "#6b7280"};color:white;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">
                ${ticket.priority || "-"}
              </span>
            </p>
          </div>
        </div>
        <div style="margin-top:25px;">
          <p style="font-size:14px;color:#4b5563;">If you have any questions, reply to this message or contact our support team.</p>
          <p style="font-size:14px;color:#4b5563;">Thank you,<br/><b>HelpyFy IT Support Team</b></p>
        </div>
      </div>
      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
        © ${new Date().getFullYear()} HelpyFy ITSM System
      </div>
    </div>
  </div>
  `;
};
