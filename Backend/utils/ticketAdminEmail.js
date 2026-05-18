export const ticketAdminEmail = (ticket = {}) => {
  return `
  <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;">

      <h2 style="color:#dc2626;">🚨 New Support Ticket (Admin)</h2>

      <p>A new ticket has been created in the system.</p>

      <hr/>

      <p><b>User:</b> ${ticket.userEmail || "-"}</p>
      <p><b>Title:</b> ${ticket.title || "-"}</p>
      <p><b>Description:</b> ${ticket.description || "-"}</p>
      <p><b>Department:</b> ${ticket.department || "-"}</p>
      <p><b>Priority:</b> ${ticket.priority || "-"}</p>

      <p><b>Status:</b> Open</p>

    </div>
  </div>
  `;
};