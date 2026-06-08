export const ticketAdminEmail = (ticket = {}) => {
  const priorityColors = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444",
    Critical: "#dc2626",
  };

  return `
  <div style="background:#f4f6f8;padding:20px;font-family:Arial,sans-serif;">

    <div style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">

      <!-- Header (simplified) -->
      <div style="background:#dc2626;color:#fff;padding:15px;">
        <h2 style="margin:0;font-size:18px;">New Ticket Created</h2>
      </div>

      <!-- Body -->
      <div style="padding:20px;font-size:14px;color:#111827;">

        <p>Hello Admin,</p>

        <p>A new support ticket has been created in HelpyFy.</p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:15px 0;"/>

        <p><b>ID:</b> ${ticket._id || "-"}</p>
        <p><b>User:</b> ${ticket.userEmail || "-"}</p>
        <p><b>Title:</b> ${ticket.title || "-"}</p>
        <p><b>Department:</b> ${ticket.department || "-"}</p>

        <p>
          <b>Priority:</b>
          <span style="color:${priorityColors[ticket.priority] || "#111"};font-weight:bold;">
            ${ticket.priority || "-"}
          </span>
        </p>

        <p><b>Description:</b></p>
        <p style="background:#f9fafb;padding:10px;border-radius:5px;">
          ${ticket.description || "-"}
        </p>

        <p><b>Status:</b> Open</p>
        <p><b>Created:</b> ${new Date().toLocaleString()}</p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:15px 0;"/>

        <p style="font-size:13px;color:#6b7280;">
          HelpyFy ITSM System Notification
        </p>

      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:10px;text-align:center;font-size:12px;color:#6b7280;">
        © ${new Date().getFullYear()} HelpyFy
      </div>

    </div>
  </div>
  `;
};