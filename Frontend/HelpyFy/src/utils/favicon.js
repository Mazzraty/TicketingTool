const DEFAULT_ICON = "https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75";

const buildDataUri = (color, label) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#ffffff"/>
      <circle cx="32" cy="32" r="24" fill="${color}"/>
      <path d="M32 14a18 18 0 1 0 18 18A18 18 0 0 0 32 14Zm0 6a12 12 0 1 1-12 12A12 12 0 0 0 32 20Z" fill="#ffffff"/>
      <circle cx="48" cy="16" r="10" fill="#ff4d4f"/>
      <text x="48" y="20" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" fill="#ffffff">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const changeFavicon = (hasAlert = false) => {
  let link = document.getElementById("favicon");

  if (!link) {
    link = document.createElement("link");
    link.id = "favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = hasAlert ? buildDataUri("#1f4a35", "!" ) : DEFAULT_ICON;
};
