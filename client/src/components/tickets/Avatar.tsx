export function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function avatarBg(name: string) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

export function gravatarUrl(email: string, size = 24): string {
  function md5(s: string): string {
    let hash = 0;
    for (let i = 0; i < s.length; i++) { const chr = s.charCodeAt(i); hash = ((hash << 5) - hash) + chr; hash |= 0; }
    const mixed = (Math.abs(hash) * 9301 + 49297) % 233280;
    let hex = '';
    const seed = s + String(mixed);
    for (let i = 0; i < seed.length; i++) { const c = (seed.charCodeAt(i) * 9301 + 49297 * i) % 256; hex += c.toString(16).padStart(2, '0'); }
    return hex.slice(0, 32);
  }
  return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=blank&s=${size}`;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const bg = avatarBg(name);
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: bg, minWidth: size }}
    >
      {avatarInitials(name)}
    </div>
  );
}
