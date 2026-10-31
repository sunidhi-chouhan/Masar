import type { ReactNode } from "react";

const common = "h-5 w-5 shrink-0";

export const NAV_ICONS: Record<string, ReactNode> = {
  trajectory: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3.5v2.5M12 18v2.5M3.5 12h2.5M18 12h2.5M6.2 6.2l1.8 1.8M16 16l1.8 1.8M17.8 6.2 16 8M8 16l-1.8 1.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  insights: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.2 7.2l1.4 1.4M15.4 15.4l1.4 1.4M16.8 7.2l-1.4 1.4M8.6 15.4l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  import: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v10M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  livingWell: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4c-2.5 3-6 5.5-6 9a6 6 0 0 0 12 0c0-3.5-3.5-6-6-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  actions: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M5 12h10M5 17h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  couple: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.5" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 18c.8-2.2 2.6-3.5 4.5-3.5s3.7 1.3 4.5 3.5M11 18c.8-2.2 2.6-3.5 4.5-3.5s3.7 1.3 4.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  privacy: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 5 7v5.5c0 4 2.8 6.8 7 8.5 4.2-1.7 7-4.5 7-8.5V7l-7-3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 11v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="9.5" r="1" fill="currentColor" />
    </svg>
  ),
  profile: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 19c1.2-3 3.5-4.5 6.5-4.5s5.3 1.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  clinician: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5h8a2 2 0 0 1 2 2v12l-3-1.5L12 19l-3-1.5L6 19V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  population: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 18V8l6-3 6 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 5v13M4 18h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  about: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 10.5V16M12 7.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  journey: (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h11M12 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
