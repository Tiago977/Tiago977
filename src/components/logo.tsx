export function Logo({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Digitalizador"
      className="shrink-0"
    >
      <rect width="512" height="512" rx="112" fill="#2f6feb" />
      <path
        d="M168 120h128l64 64v208a24 24 0 0 1-24 24H168a24 24 0 0 1-24-24V144a24 24 0 0 1 24-24Z"
        fill="#fff"
      />
      <path
        d="M296 120v48a16 16 0 0 0 16 16h48"
        fill="none"
        stroke="#2f6feb"
        strokeWidth="18"
        strokeLinejoin="round"
      />
      <g stroke="#2f6feb" strokeWidth="18" strokeLinecap="round">
        <path d="M188 248h136M188 296h136M188 344h84" />
      </g>
    </svg>
  );
}
