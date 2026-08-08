import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

/* =========================================================
   ICONS
========================================================= */

const Icon = ({ type, className = "w-4 h-4" }) => {
  const icons = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),

    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    alert: (
      <>
        <path d="m10.3 3.6-8 14A2 2 0 0 0 4 20.5h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),

    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
        <path d="m3 18 9 5 9-5" />
      </>
    ),

    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,

    note: (
      <>
        <path d="M14 3v5h5" />
        <path d="M5 3h9l5 5v13H5z" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </>
    ),

    clip: (
      <path d="m21 11-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    left: <path d="m15 18-6-6 6-6" />,

    right: <path d="m9 18 6-6-6-6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icons[type]}
    </svg>
  );
};

/* =========================================================
   STATUS THEME
========================================================= */

const STATUS_THEME = {
  Open: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    accent: "bg-blue-500",
  },

  "In Progress": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    accent: "bg-amber-500",
  },

  Resolved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-500",
  },

  Closed: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    accent: "bg-slate-400",
  },
};

/* =========================================================
   SLA THEME
========================================================= */

const SLA_THEME = {
  ok: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },

  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },

  breached: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },

  done: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

/* =========================================================
   PRIORITY
========================================================= */

const PRIORITY_THEME = {
  Low: "bg-blue-50 text-blue-700 border-blue-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
};

/* =========================================================
   FORMATTERS
========================================================= */

const formatDuration = (ms) => {
  const minutes = Math.floor(Math.abs(ms) / 60000);

  const days = Math.floor(minutes / 1440);

  const hours = Math.floor(
    (minutes % 1440) / 60
  );

  const mins = minutes % 60;

  if (days) {
    return `${days}d ${hours}h`;
  }

  if (hours) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
};

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};

const formatShortDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};

const getInitial = (name) => {
  if (!name) return "?";

  return name
    .trim()
    .charAt(0)
    .toUpperCase();
};

/* =========================================================
   REPORTER HELPERS
========================================================= */

const getReporterName = (ticket) =>
  ticket.userId?.name ||
  ticket.employeeId?.name ||
  ticket.userId?.email ||
  "Unknown";

const getReporterSubtext = (ticket) => {
  if (ticket.userId?.email) {
    return ticket.userId.email;
  }

  if (ticket.employeeId?.staffCode) {
    return `Staff Code: ${ticket.employeeId.staffCode}`;
  }

  return "—";
};

/* =========================================================
   SLA LEG
========================================================= */

const getSlaLegState = ({
  due,
  achievedAt,
  breached,
  now,
}) => {
  if (!due) {
    return {
      level: "done",
      label: "No SLA",
      detail: "—",
    };
  }

  const dueDate = new Date(due);

  if (achievedAt) {
    const achievedDate =
      new Date(achievedAt);

    if (
      breached ||
      achievedDate > dueDate
    ) {
      return {
        level: "breached",
        label: "Breached",
        detail: `${formatDuration(
          achievedDate - dueDate
        )} late`,
      };
    }

    return {
      level: "ok",
      label: "Met",
      detail: `${formatDuration(
        dueDate - achievedDate
      )} to spare`,
    };
  }

  const diff = dueDate - now;

  if (diff <= 0) {
    return {
      level: "breached",
      label: "Overdue",
      detail: `${formatDuration(
        diff
      )} over`,
    };
  }

  const isSoon =
    diff < 60 * 60 * 1000;

  return {
    level: isSoon
      ? "warning"
      : "ok",

    label: isSoon
      ? "Due soon"
      : "On track",

    detail: `due in ${formatDuration(
      diff
    )}`,
  };
};

/* =========================================================
   OVERALL SLA
========================================================= */

const getOverallSlaState = (
  ticket,
  now
) => {
  const sla = ticket.sla;

  if (!sla) {
    return {
      level: "done",
      label: "No SLA",
    };
  }

  if (sla.status === "Breached") {
    return {
      level: "breached",
      label: "SLA Breached",
    };
  }

  if (sla.status === "Completed") {
    return {
      level: "ok",
      label: "SLA Met",
    };
  }

  const resolutionState =
    getSlaLegState({
      due: sla.resolutionDue,
      achievedAt: sla.resolvedAt,
      breached:
        sla.resolutionBreached,
      now,
    });

  if (
    resolutionState.level ===
    "breached"
  ) {
    return {
      level: "breached",
      label: "SLA Breached",
    };
  }

  if (!sla.firstRespondedAt) {
    const responseState =
      getSlaLegState({
        due: sla.firstResponseDue,
        achievedAt:
          sla.firstRespondedAt,
        breached:
          sla.firstResponseBreached,
        now,
      });

    if (
      responseState.level ===
      "breached"
    ) {
      return {
        level: "breached",
        label: "Response overdue",
      };
    }

    if (
      responseState.level ===
      "warning"
    ) {
      return {
        level: "warning",
        label: "Response due soon",
      };
    }
  }

  if (
    resolutionState.level ===
    "warning"
  ) {
    return {
      level: "warning",
      label: "Resolution due soon",
    };
  }

  return {
    level: "ok",
    label: "On track",
  };
};

/* =========================================================
   SLA BADGE
========================================================= */

const SlaBadge = ({
  ticket,
  now,
}) => {
  const state =
    getOverallSlaState(
      ticket,
      now
    );

  const theme =
    SLA_THEME[state.level];

  return (
    <span
      className={`
        inline-flex
        items-center
        justify-center
        gap-1.5
        px-2.5
        py-1
        rounded-full
        border
        text-[11px]
        font-semibold
        whitespace-nowrap
        ${theme.bg}
        ${theme.text}
        ${theme.border}
      `}
    >
      {state.level ===
      "breached" ? (
        <Icon
          type="alert"
          className="w-3 h-3"
        />
      ) : (
        <span
          className={`
            w-1.5
            h-1.5
            rounded-full
            ${theme.dot}
          `}
        />
      )}

      {state.label}
    </span>
  );
};

/* =========================================================
   SLA DETAIL ROW
========================================================= */

const SlaLegRow = ({
  icon,
  label,
  due,
  achievedAt,
  breached,
  achievedLabel,
  now,
}) => {
  const state =
    getSlaLegState({
      due,
      achievedAt,
      breached,
      now,
    });

  const theme =
    SLA_THEME[state.level];

  return (
    <div
      className={`
        rounded-lg
        border
        p-3
        ${theme.bg}
        ${theme.border}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`
            text-xs
            font-semibold
            flex
            items-center
            gap-1.5
            ${theme.text}
          `}
        >
          {icon}
          {label}
        </p>

        <span
          className={`
            text-[11px]
            font-semibold
            ${theme.text}
          `}
        >
          {state.label}
        </span>
      </div>

      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          text-[11px]
          text-slate-500
          mt-1
        "
      >
        <span>
          Due{" "}
          {due
            ? formatShortDate(due)
            : "—"}
        </span>

        <span
          className={
            theme.text
          }
        >
          {state.detail}
        </span>
      </div>

      {achievedAt && (
        <p className="text-[11px] text-slate-500 mt-1">
          {achievedLabel}{" "}
          {formatShortDate(
            achievedAt
          )}
        </p>
      )}
    </div>
  );
};

/* =========================================================
   SLA DETAIL PANEL
========================================================= */

const SlaDetailPanel = ({
  ticket,
  now,
}) => {
  const sla = ticket.sla;

  if (!sla) {
    return (
      <p className="text-xs text-slate-400">
        No SLA policy on this ticket
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span
          className={`
            inline-flex
            items-center
            px-2
            py-0.5
            rounded-full
            text-[10px]
            font-semibold
            text-white
            ${
              sla.priority ===
              "Low"
                ? "bg-blue-500"
                : sla.priority ===
                  "Medium"
                ? "bg-amber-500"
                : sla.priority ===
                  "High"
                ? "bg-orange-500"
                : "bg-red-500"
            }
          `}
        >
          {sla.priority || "—"}{" "}
          priority
        </span>

        <SlaBadge
          ticket={ticket}
          now={now}
        />
      </div>

      <SlaLegRow
        icon={
          <Icon
            type="bolt"
            className="w-3.5 h-3.5"
          />
        }
        label="First Response"
        due={sla.firstResponseDue}
        achievedAt={
          sla.firstRespondedAt
        }
        breached={
          sla.firstResponseBreached
        }
        achievedLabel="Responded at"
        now={now}
      />

      <SlaLegRow
        icon={
          <Icon
            type="check"
            className="w-3.5 h-3.5"
          />
        }
        label="Resolution"
        due={sla.resolutionDue}
        achievedAt={
          sla.resolvedAt
        }
        breached={
          sla.resolutionBreached
        }
        achievedLabel="Resolved at"
        now={now}
      />

      {sla.escalated && (
        <div
          className="
            rounded-lg
            border
            border-orange-200
            bg-orange-50
            p-3
            flex
            items-center
            gap-2
          "
        >
          <Icon
            type="alert"
            className="w-3.5 h-3.5 text-orange-600 shrink-0"
          />

          <p className="text-[11px] text-orange-700 font-medium">
            Escalated — Level{" "}
            {sla.escalationLevel ||
              1}

            {sla.escalatedAt &&
              ` on ${new Date(
                sla.escalatedAt
              ).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   STATUS SELECT
========================================================= */

const StatusSelect = ({
  ticket,
  onChange,
}) => {
  const theme =
    STATUS_THEME[
      ticket.status
    ] || STATUS_THEME.Open;

  return (
    <div className="relative inline-block">
      <select
        value={ticket.status}
        onChange={(e) =>
          onChange(
            ticket,
            e.target.value
          )
        }
        className={`
          appearance-none
          cursor-pointer
          rounded-full
          border
          pl-3
          pr-7
          py-1.5
          text-[11px]
          font-semibold
          outline-none
          ${theme.bg}
          ${theme.text}
          ${theme.border}
        `}
      >
        <option value="Open">
          Open
        </option>

        <option value="In Progress">
          In Progress
        </option>

        <option value="Resolved">
          Resolved
        </option>

        <option value="Closed">
          Closed
        </option>
      </select>

      <span
        className={`
          pointer-events-none
          absolute
          right-2.5
          top-1/2
          -translate-y-1/2
          w-1.5
          h-1.5
          rounded-full
          ${theme.accent}
        `}
      />
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  label,
  value,
  color,
  icon,
}) => (
  <div
    className="
      relative
      bg-white
      border
      border-slate-200
      rounded-xl
      p-4
      shadow-sm
      overflow-hidden
    "
  >
    <span
      className={`
        absolute
        left-0
        top-0
        bottom-0
        w-1
        ${color}
      `}
    />

    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
        {icon}
      </span>
    </div>

    <p className="text-2xl font-bold text-slate-900 tabular-nums">
      {value}
    </p>
  </div>
);

/* =========================================================
   STARS
========================================================= */

const renderStars = (rating) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(
      (star) => (
        <span
          key={star}
          className={
            star <= rating
              ? "text-amber-400"
              : "text-slate-200"
          }
        >
          ★
        </span>
      )
    )}
  </div>
);

/* =========================================================
   TICKET DETAILS DRAWER
========================================================= */

const TicketDrawer = ({
  ticket,
  now,
  onClose,
}) => {
  if (!ticket) return null;

  const reporter =
    getReporterName(ticket);

  const reporterSubtext =
    getReporterSubtext(
      ticket
    );

  return (
    <>
      <div
        className="
          fixed
          inset-0
          bg-slate-900/20
          z-40
        "
        onClick={onClose}
      />

      <aside
        className="
          fixed
          right-0
          top-0
          bottom-0
          w-full
          sm:w-[440px]
          bg-white
          z-50
          shadow-2xl
          border-l
          border-slate-200
          flex
          flex-col
        "
      >
        {/* DRAWER HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            px-5
            py-4
            border-b
            border-slate-100
          "
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Ticket Details
            </p>

            <h2 className="font-bold text-slate-900 truncate mt-1">
              {ticket.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="
              w-8
              h-8
              rounded-lg
              flex
              items-center
              justify-center
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
              shrink-0
            "
          >
            <Icon
              type="x"
              className="w-4 h-4"
            />
          </button>
        </div>

        {/* DRAWER CONTENT */}

        <div className="p-5 overflow-y-auto space-y-5">
          {/* REPORTER */}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold shrink-0">
              {getInitial(
                reporter
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                <Icon
                  type="user"
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                />

                {reporter}
              </p>

              <p className="text-xs text-slate-400 truncate">
                {reporterSubtext}
              </p>

              <span
                className={`
                  inline-flex
                  items-center
                  gap-1
                  text-[11px]
                  font-medium
                  px-2
                  py-0.5
                  rounded-full
                  mt-1
                  ${
                    STATUS_THEME[
                      ticket.status
                    ]?.bg
                  }
                  ${
                    STATUS_THEME[
                      ticket.status
                    ]?.text
                  }
                `}
              >
                <span
                  className={`
                    w-1.5
                    h-1.5
                    rounded-full
                    ${
                      STATUS_THEME[
                        ticket.status
                      ]?.accent
                    }
                  `}
                />

                {ticket.status}
              </span>
            </div>
          </div>

          {/* SLA */}

          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Icon
                type="clock"
                className="w-3.5 h-3.5"
              />

              SLA Tracking
            </p>

            <SlaDetailPanel
              ticket={ticket}
              now={now}
            />
          </section>

          {/* DESCRIPTION */}

          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Description
            </p>

            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm text-slate-700 leading-relaxed">
              {ticket.description ||
                "No description provided."}
            </div>
          </section>

          {/* BASIC INFORMATION */}

          <section>
            <div className="grid grid-cols-3 gap-2">
              <InfoBox
                label="Priority"
                value={
                  ticket.priority
                }
              />

              <InfoBox
                label="Company"
                value={
                  ticket.companyId
                    ?.name || "—"
                }
              />

              <InfoBox
                label="Department"
                value={
                  ticket.department ||
                  "—"
                }
              />
            </div>
          </section>

          {/* DATES */}

          <section>
            <div className="grid grid-cols-3 gap-2">
              <InfoBox
                label="Opened"
                value={formatDateTime(
                  ticket.createdAt
                )}
              />

              <InfoBox
                label="Resolved"
                value={formatDateTime(
                  ticket.resolvedAt
                )}
              />

              <InfoBox
                label="Closed"
                value={formatDateTime(
                  ticket.closedAt
                )}
              />
            </div>
          </section>

          {/* RESOLUTION NOTE */}

          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Icon
                type="note"
                className="w-3.5 h-3.5"
              />

              Resolution Note
            </p>

            {ticket.resolutionNote ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-3 rounded-lg leading-relaxed">
                {
                  ticket.resolutionNote
                }
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Not resolved yet
              </p>
            )}
          </section>

          {/* ATTACHMENTS */}

          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Attachments
            </p>

            {ticket.files?.length >
            0 ? (
              <div className="space-y-2">
                {ticket.files.map(
                  (file, index) => (
                    <a
                      key={index}
                      href={
                        file.url ||
                        file
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Icon
                        type="clip"
                        className="w-3.5 h-3.5"
                      />

                      Download File{" "}
                      {index + 1}
                    </a>
                  )
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No attachments
              </p>
            )}
          </section>

          {/* REVIEW */}

          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Review
            </p>

            {ticket.rating ? (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                {renderStars(
                  ticket.rating
                )}

                {ticket.review && (
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {ticket.review}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No review submitted
              </p>
            )}
          </section>
        </div>
      </aside>
    </>
  );
};

/* =========================================================
   INFO BOX
========================================================= */

const InfoBox = ({
  label,
  value,
}) => (
  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 min-w-0">
    <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-0.5">
      {label}
    </p>

    <p className="text-[11px] font-medium text-slate-700 truncate">
      {value}
    </p>
  </div>
);

/* =========================================================
   MOBILE TICKET CARD
========================================================= */

const MobileTicketCard = ({
  ticket,
  now,
  user,
  onView,
  onStatusChange,
  onEscalate,
}) => {
  const reporter =
    getReporterName(ticket);

  const canEscalate =
    user?.role ===
      "it_support" &&
    !ticket.sla?.escalated &&
    ticket.status !== "Closed";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      {/* TOP */}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
            {getInitial(
              reporter
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {reporter}
            </p>

            <p className="text-[11px] text-slate-400 truncate">
              {getReporterSubtext(
                ticket
              )}
            </p>
          </div>
        </div>

        <SlaBadge
          ticket={ticket}
          now={now}
        />
      </div>

      {/* TITLE */}

      <div className="border-t border-slate-100 mt-4 pt-3">
        <p className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">
          Ticket
        </p>

        <p className="text-sm font-semibold text-slate-800 mt-1">
          {ticket.title}
        </p>
      </div>

      {/* DETAILS */}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">
            Priority
          </p>

          <span
            className={`
              inline-flex
              mt-1
              px-2
              py-1
              rounded-full
              border
              text-[11px]
              font-semibold
              ${
                PRIORITY_THEME[
                  ticket.priority
                ] ||
                "bg-slate-50 text-slate-600 border-slate-200"
              }
            `}
          >
            {ticket.priority}
          </span>
        </div>

        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">
            Status
          </p>

          <div className="mt-1">
            <StatusSelect
              ticket={ticket}
              onChange={
                onStatusChange
              }
            />
          </div>
        </div>
      </div>

      {/* ACTIONS */}

      <div className="border-t border-slate-100 mt-4 pt-3 flex gap-2">
        <button
          onClick={() =>
            onView(ticket)
          }
          className="
            flex-1
            flex
            items-center
            justify-center
            gap-1.5
            py-2
            rounded-lg
            bg-blue-50
            hover:bg-blue-100
            text-blue-700
            text-xs
            font-semibold
          "
        >
          <Icon
            type="eye"
            className="w-3.5 h-3.5"
          />

          View
        </button>

        {canEscalate && (
          <button
            onClick={() =>
              onEscalate(
                ticket._id
              )
            }
            className="
              flex-1
              py-2
              rounded-lg
              bg-red-600
              hover:bg-red-700
              text-white
              text-xs
              font-semibold
            "
          >
            Escalate
          </button>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminTickets() {
  const [tickets, setTickets] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [selected, setSelected] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [statusModal, setStatusModal] =
    useState(null);

  const [
    resolutionNote,
    setResolutionNote,
  ] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const user = JSON.parse(
    localStorage.getItem("user") ||
      "null"
  );

  const [now, setNow] =
    useState(() => new Date());

  const initialStats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  };

  const [stats, setStats] =
    useState(initialStats);

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    load(page);
    loadStats();
  }, [page]);

  /* =======================================================
     LIVE SLA CLOCK
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        setNow(new Date());
      }, 30000);

    return () =>
      clearInterval(interval);
  }, []);

  /* =======================================================
     LOAD TICKETS
  ======================================================= */

  const load = async (
    pageNumber = 1
  ) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/tickets?page=${pageNumber}&limit=10`
      );

      setTickets(
        res?.data?.data || []
      );

      setTotalPages(
        res?.data?.pages || 1
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load tickets"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD STATS
  ======================================================= */

  const loadStats = async () => {
    try {
      const res = await api.get(
        "/tickets/stats"
      );

      const data =
        res?.data?.data;

      setStats({
        total:
          data?.total ?? 0,

        open:
          data?.open ?? 0,

        inProgress:
          data?.inProgress ?? 0,

        resolved:
          data?.resolved ?? 0,

        closed:
          data?.closed ?? 0,
      });
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load stats"
      );

      setStats(
        initialStats
      );
    }
  };

  /* =======================================================
     STATUS CHANGE
  ======================================================= */

  const handleStatusChange = (
    ticket,
    targetStatus
  ) => {
    if (
      targetStatus ===
        "Resolved" ||
      targetStatus === "Closed"
    ) {
      setResolutionNote(
        ticket.resolutionNote ||
          ""
      );

      setStatusModal({
        ticket,
        targetStatus,
      });

      return;
    }

    updateStatus(
      ticket._id,
      targetStatus
    );
  };

  /* =======================================================
     ESCALATE
  ======================================================= */

  const handleEscalate =
    async (id) => {
      try {
        await api.put(
          `/tickets/${id}/escalate`,
          {
            reason:
              "Escalated by IT Support",
          }
        );

        toast.success(
          "Ticket escalated successfully"
        );

        await load(page);
        await loadStats();
      } catch (error) {
        console.error(error);

        toast.error(
          error.response?.data
            ?.message ||
            "Failed to escalate"
        );
      }
    };

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const updateStatus = async (
    id,
    status,
    extra = {}
  ) => {
    try {
      const payload = {
        status,
        ...extra,
      };

      if (
        status === "Resolved"
      ) {
        payload.resolvedAt =
          new Date().toISOString();
      }

      if (
        status === "Closed"
      ) {
        payload.closedAt =
          new Date().toISOString();
      }

      await api.put(
        `/tickets/${id}`,
        payload
      );

      toast.success(
        `Ticket marked as ${status}`
      );

      await load(page);
      await loadStats();

      /* Update drawer if the same ticket is open */
      if (
        selected?._id === id
      ) {
        setSelected(
          (current) =>
            current
              ? {
                  ...current,
                  status,
                  ...extra,
                  ...(status ===
                  "Resolved"
                    ? {
                        resolvedAt:
                          payload.resolvedAt,
                      }
                    : {}),
                  ...(status ===
                  "Closed"
                    ? {
                        closedAt:
                          payload.closedAt,
                      }
                    : {}),
                }
              : null
        );
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data
          ?.message ||
          "Update failed"
      );

      throw error;
    }
  };

  /* =======================================================
     CONFIRM RESOLUTION / CLOSE
  ======================================================= */

  const confirmStatusModal =
    async () => {
      if (
        !resolutionNote.trim()
      ) {
        toast.error(
          "Please add a resolution note before continuing"
        );

        return;
      }

      try {
        setSubmitting(true);

        await updateStatus(
          statusModal.ticket._id,
          statusModal.targetStatus,
          {
            resolutionNote:
              resolutionNote.trim(),
          }
        );

        setStatusModal(null);
        setResolutionNote("");
      } catch {
        /* updateStatus already shows error */
      } finally {
        setSubmitting(false);
      }
    };

  /* =======================================================
     CANCEL MODAL
  ======================================================= */

  const cancelStatusModal =
    () => {
      setStatusModal(null);
      setResolutionNote("");
    };

  /* =======================================================
     SEARCH
  ======================================================= */

  const filtered =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return tickets;
      }

      return tickets.filter(
        (ticket) => {
          const slaState =
            getOverallSlaState(
              ticket,
              now
            ).label.toLowerCase();

          const values = [
            ticket.title,
            ticket.description,
            getReporterName(
              ticket
            ),
            getReporterSubtext(
              ticket
            ),
            ticket.priority,
            ticket.status,
            ticket.department,
            ticket.companyId?.name,
            slaState,
          ];

          return values
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query)
            );
        }
      );
    }, [
      tickets,
      search,
      now,
    ]);

  /* =======================================================
     SLA BREACHED COUNT
  ======================================================= */

  const breachedCount =
    tickets.filter(
      (ticket) =>
        getOverallSlaState(
          ticket,
          now
        ).level ===
        "breached"
    ).length;

  /* =======================================================
     STAT CARDS
  ======================================================= */

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      color: "bg-slate-400",
      icon: (
        <Icon
          type="layers"
          className="w-4 h-4"
        />
      ),
    },

    {
      label: "Open",
      value: stats.open,
      color: "bg-blue-500",
      icon: (
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
      ),
    },

    {
      label: "In Progress",
      value: stats.inProgress,
      color: "bg-amber-500",
      icon: (
        <Icon
          type="clock"
          className="w-4 h-4"
        />
      ),
    },

    {
      label: "Resolved",
      value: stats.resolved,
      color: "bg-emerald-500",
      icon: (
        <Icon
          type="check"
          className="w-4 h-4"
        />
      ),
    },

    {
      label: "Closed",
      value: stats.closed,
      color: "bg-slate-500",
      icon: (
        <Icon
          type="lock"
          className="w-4 h-4"
        />
      ),
    },

    {
      label: "SLA Breached",
      value: breachedCount,
      color: "bg-red-500",
      icon: (
        <Icon
          type="alert"
          className="w-4 h-4"
        />
      ),
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ticket Management
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Track, resolve, and review
              support requests
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Icon
              type="search"
              className="
                w-4
                h-4
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search tickets, users, status, SLA..."
              className="
                w-full
                bg-white
                border
                border-slate-200
                rounded-lg
                pl-9
                pr-3
                py-2.5
                text-sm
                outline-none
                placeholder:text-slate-400
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-500/10
              "
            />
          </div>
        </div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statCards.map(
            (card) => (
              <StatCard
                key={card.label}
                {...card}
              />
            )
          )}
        </div>

        {/* =================================================
            DESKTOP TABLE

            ONLY 6 COLUMNS

            Ticket
            Reported By
            Priority
            Status
            SLA
            Actions
        ================================================= */}

        <div className="hidden md:block">
          <div
            className="
              bg-white
              border
              border-slate-200
              rounded-xl
              shadow-sm
              overflow-hidden
            "
          >
            {loading ? (
              <div className="p-16 text-center text-sm text-slate-400">
                Loading tickets...
              </div>
            ) : filtered.length ===
              0 ? (
              <div className="p-16 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No tickets found
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Try another keyword
                  or clear the search
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                {/* HEADER */}

                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-[28%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Ticket
                    </th>

                    <th className="w-[23%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Reported By
                    </th>

                    <th className="w-[11%] px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Priority
                    </th>

                    <th className="w-[14%] px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="w-[12%] px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      SLA
                    </th>

                    <th className="w-[17%] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* BODY */}

                <tbody className="divide-y divide-slate-100">
                  {filtered.map(
                    (ticket) => {
                      const reporter =
                        getReporterName(
                          ticket
                        );

                      const reporterSub =
                        getReporterSubtext(
                          ticket
                        );

                      const canEscalate =
                        user?.role ===
                          "it_support" &&
                        !ticket.sla
                          ?.escalated &&
                        ticket.status !==
                          "Closed";

                      return (
                        <tr
                          key={
                            ticket._id
                          }
                          className="
                            hover:bg-slate-50/70
                            transition-colors
                          "
                        >
                          {/* TICKET */}

                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-slate-800
                                  truncate
                                "
                                title={
                                  ticket.title
                                }
                              >
                                {
                                  ticket.title
                                }
                              </p>

                              <p className="text-[11px] text-slate-400 mt-1 truncate">
                                {ticket.department ||
                                  "Support request"}
                              </p>
                            </div>
                          </td>

                          {/* REPORTER */}

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {getInitial(
                                  reporter
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="
                                    text-sm
                                    font-semibold
                                    text-slate-800
                                    truncate
                                  "
                                  title={
                                    reporter
                                  }
                                >
                                  {
                                    reporter
                                  }
                                </p>

                                <p
                                  className="
                                    text-[11px]
                                    text-slate-400
                                    truncate
                                  "
                                  title={
                                    reporterSub
                                  }
                                >
                                  {
                                    reporterSub
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* PRIORITY */}

                          <td className="px-3 py-4 text-center">
                            <span
                              className={`
                                inline-flex
                                items-center
                                justify-center
                                px-2.5
                                py-1
                                rounded-full
                                border
                                text-[11px]
                                font-semibold
                                whitespace-nowrap
                                ${
                                  PRIORITY_THEME[
                                    ticket.priority
                                  ] ||
                                  "bg-slate-50 text-slate-600 border-slate-200"
                                }
                              `}
                            >
                              {
                                ticket.priority
                              }
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-3 py-4 text-center">
                            <StatusSelect
                              ticket={
                                ticket
                              }
                              onChange={
                                handleStatusChange
                              }
                            />
                          </td>

                          {/* SLA */}

                          <td className="px-3 py-4 text-center">
                            <SlaBadge
                              ticket={
                                ticket
                              }
                              now={now}
                            />
                          </td>

                          {/* ACTIONS */}

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  setSelected(
                                    ticket
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  gap-1.5
                                  px-3
                                  py-1.5
                                  rounded-lg
                                  bg-blue-50
                                  hover:bg-blue-100
                                  text-blue-700
                                  text-xs
                                  font-semibold
                                  transition
                                "
                              >
                                <Icon
                                  type="eye"
                                  className="w-3.5 h-3.5"
                                />

                                View
                              </button>

                              {canEscalate && (
                                <button
                                  onClick={() =>
                                    handleEscalate(
                                      ticket._id
                                    )
                                  }
                                  className="
                                    px-3
                                    py-1.5
                                    rounded-lg
                                    bg-red-600
                                    hover:bg-red-700
                                    text-white
                                    text-xs
                                    font-semibold
                                    transition
                                  "
                                >
                                  Escalate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* =================================================
            MOBILE
        ================================================= */}

        <div className="md:hidden">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-400">
              Loading tickets...
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-medium text-slate-600">
                No tickets found
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Try another keyword
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(
                (ticket) => (
                  <MobileTicketCard
                    key={
                      ticket._id
                    }
                    ticket={
                      ticket
                    }
                    now={now}
                    user={user}
                    onView={
                      setSelected
                    }
                    onStatusChange={
                      handleStatusChange
                    }
                    onEscalate={
                      handleEscalate
                    }
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="flex justify-center items-center gap-3 mt-5">
          <button
            disabled={page === 1}
            onClick={() =>
              setPage(
                page - 1
              )
            }
            className="
              w-9
              h-9
              flex
              items-center
              justify-center
              border
              border-slate-200
              bg-white
              rounded-lg
              text-slate-500
              hover:bg-slate-50
              disabled:opacity-40
              disabled:hover:bg-white
            "
          >
            <Icon
              type="left"
              className="w-4 h-4"
            />
          </button>

          <span className="text-xs font-medium text-slate-500 tabular-nums">
            Page {page} of{" "}
            {totalPages}
          </span>

          <button
            disabled={
              page ===
              totalPages
            }
            onClick={() =>
              setPage(
                page + 1
              )
            }
            className="
              w-9
              h-9
              flex
              items-center
              justify-center
              border
              border-slate-200
              bg-white
              rounded-lg
              text-slate-500
              hover:bg-slate-50
              disabled:opacity-40
              disabled:hover:bg-white
            "
          >
            <Icon
              type="right"
              className="w-4 h-4"
            />
          </button>
        </div>
      </main>

      {/* ===================================================
          TICKET DRAWER
      =================================================== */}

      <TicketDrawer
        ticket={selected}
        now={now}
        onClose={() =>
          setSelected(null)
        }
      />

      {/* ===================================================
          RESOLVE / CLOSE MODAL
      =================================================== */}

      {statusModal && (
        <div
          className="
            fixed
            inset-0
            bg-slate-900/40
            backdrop-blur-[2px]
            flex
            items-center
            justify-center
            z-[60]
            p-4
          "
        >
          <div
            className="
              bg-white
              rounded-2xl
              shadow-xl
              w-full
              max-w-md
              p-5
              sm:p-6
            "
          >
            {/* HEADER */}

            <div className="flex items-center gap-3">
              <span
                className={`
                  w-9
                  h-9
                  rounded-full
                  flex
                  items-center
                  justify-center
                  shrink-0
                  ${
                    statusModal.targetStatus ===
                    "Resolved"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-600"
                  }
                `}
              >
                <Icon
                  type={
                    statusModal.targetStatus ===
                    "Resolved"
                      ? "check"
                      : "lock"
                  }
                  className="w-4 h-4"
                />
              </span>

              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900">
                  Mark as{" "}
                  {
                    statusModal.targetStatus
                  }
                </h3>

                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {
                    statusModal
                      .ticket
                      .title
                  }
                </p>
              </div>
            </div>

            {/* SLA */}

            <div className="mt-4">
              <SlaBadge
                ticket={
                  statusModal.ticket
                }
                now={now}
              />
            </div>

            {/* NOTE */}

            <label className="text-xs font-medium text-slate-500 mb-1.5 mt-5 block">
              Resolution note{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <textarea
              rows={4}
              value={
                resolutionNote
              }
              onChange={(e) =>
                setResolutionNote(
                  e.target.value
                )
              }
              autoFocus
              placeholder="Describe how the issue was resolved..."
              className="
                w-full
                border
                border-slate-200
                rounded-lg
                p-3
                text-sm
                outline-none
                resize-none
                placeholder:text-slate-400
                focus:ring-2
                focus:ring-blue-500/10
                focus:border-blue-400
              "
            />

            <p className="text-[11px] text-slate-400 mt-1.5">
              This note will be saved
              with the ticket.
            </p>

            {/* BUTTONS */}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={
                  cancelStatusModal
                }
                disabled={
                  submitting
                }
                className="
                  px-4
                  py-2
                  text-sm
                  rounded-lg
                  border
                  border-slate-200
                  text-slate-600
                  hover:bg-slate-50
                  transition
                  font-medium
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                onClick={
                  confirmStatusModal
                }
                disabled={
                  submitting
                }
                className="
                  px-4
                  py-2
                  text-sm
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  font-semibold
                  transition
                  disabled:opacity-60
                "
              >
                {submitting
                  ? "Saving..."
                  : `Confirm ${statusModal.targetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}