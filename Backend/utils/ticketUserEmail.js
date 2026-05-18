export const ticketUserEmail = (ticket = {}) => {
  const priorityColors = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444",
    Critical: "#dc2626",
  };

  return `
  <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
    
    <div style="max-width:650px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

      <!-- Header -->
      <div style="background:#16a34a;padding:20px;color:white;">
        <h2 style="margin:0;">🎫 HelpyFy Ticket Created</h2>
        <p style="margin-top:5px;font-size:14px;">
          Your support request has been received successfully
        </p>
      </div>

      <!-- Body -->
      <div style="padding:25px;">

        <p style="font-size:15px;color:#111827;">
          Hi <b>${ticket.userEmail || "User"}</b>,
        </p>

        <p style="font-size:14px;color:#4b5563;line-height:1.6;">
          Your IT support ticket has been successfully created.
          Our support team will review and respond shortly.
        </p>

        <!-- Ticket Details -->
        <div style="margin-top:25px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          
          <div style="background:#f9fafb;padding:12px 18px;border-bottom:1px solid #e5e7eb;">
            <h3 style="margin:0;font-size:16px;color:#111827;">
              Ticket Details
            </h3>
          </div>

          <div style="padding:18px;">

            <p style="margin:10px 0;">
              <b>Ticket ID:</b> ${ticket._id || "-"}
            </p>

            <p style="margin:10px 0;">
              <b>Title:</b> ${ticket.title || "-"}
            </p>

            <p style="margin:10px 0;">
              <b>Description:</b><br/>
              ${ticket.description || "-"}
            </p>

            <p style="margin:10px 0;">
              <b>Department:</b> ${ticket.department || "-"}
            </p>

            <p style="margin:10px 0;">
              <b>Priority:</b>
              <span style="
                background:${priorityColors[ticket.priority] || "#6b7280"};
                color:white;
                padding:4px 10px;
                border-radius:20px;
                font-size:12px;
                font-weight:bold;
              ">
                ${ticket.priority || "-"}
              </span>
            </p>

            <p style="margin:10px 0;">
              <b>Created At:</b>
              ${new Date().toLocaleString()}
            </p>

          </div>
        </div>

        <!-- Footer Message -->
        <div style="margin-top:25px;">
          <p style="font-size:14px;color:#4b5563;">
            Please do not reply directly to this email.
          </p>

          <p style="font-size:14px;color:#4b5563;">
            Thank you,<br/>
            <b>HelpyFy IT Support Team</b>
          </p>
        </div>

      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
        © ${new Date().getFullYear()} HelpyFy ITSM System
      </div>

    </div>
  </div>
  `;
};