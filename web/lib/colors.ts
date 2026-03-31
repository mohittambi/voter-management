// Central color palette for the Voter Management Portal — see docs/DESIGN_GUIDELINES.md
// Primary = Congress Blue. Saffron/orange entirely avoided.

export const colors = {
  // Primary — Congress Blue
  primary:         '#0D47A1',
  primaryHover:    '#1565C0',
  primaryLight:    '#E3F0FF',
  /** Light border on primary-tinted panels (aligns with status pill borders) */
  primaryBorderLight: '#90CAF9',

  // Accent — Teal
  accent:          '#00796B',
  accentHover:     '#00695C',
  accentLight:     '#E0F2F1',

  // Service Request Status
  statusSubmitted: '#1565C0',   // Document Submitted
  statusShared:    '#4527A0',   // Document Shared to Office
  statusWIP:       '#1976D2',   // Work in Progress
  statusCompleted: '#1B5E20',   // Work Completed
  statusClosed:    '#37474F',   // Closed / Delivered

  // Feedback
  success:         '#1B5E20',
  warning:         '#F9A825',
  error:           '#B71C1C',

  // Backgrounds
  pageBg:          '#F5F7FA',
  surface:         '#FFFFFF',
  borderLight:     '#E0E0E0',

  // Typography
  textPrimary:     '#1A1A1A',
  /** Page titles / emphasized labels (slate; used across profile and tables) */
  textHeading:     '#0f172a',
  textSecondary:   '#424242',
  textDisabled:    '#9E9E9E',
  /** Supporting / caption text (slate) */
  textMuted:       '#64748b',
  /** Timestamps, dividers, empty-state hint text */
  textSubtle:      '#94a3b8',
  textOnPrimary:   '#FFFFFF',
  textOnAccent:    '#FFFFFF',
};

// Service request status display config
export const SR_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Document Submitted':        { color: '#1565C0', bg: '#E3F2FD', border: '#90CAF9' },
  'Document Shared to Office': { color: '#4527A0', bg: '#EDE7F6', border: '#CE93D8' },
  'Work in Progress':          { color: '#1976D2', bg: '#E3F0FF', border: '#90CAF9' },
  'Work Completed':            { color: '#1B5E20', bg: '#E8F5E9', border: '#A5D6A7' },
  'Closed / Delivered':        { color: '#37474F', bg: '#ECEFF1', border: '#B0BEC5' },
};

/** Voter list row states — left border 4px + background (government-style, low saturation) */
export const VOTER_LIST_ROW = {
  inactive_record: {
    bg: '#ECEFF1',
    border: '#546E7A',
    hoverBg: '#E3E6EA',
    labelEn: 'Inactive voter status',
    labelMr: 'निष्क्रिय मतदार स्थिती',
  },
  non_voter: {
    bg: '#E8EAF0',
    border: '#607D8B',
    hoverBg: '#DFE2EB',
    labelEn: 'Non-voter record',
    labelMr: 'नॉन-व्होटर नोंद',
  },
  validated_complete: {
    bg: '#E8F5E9',
    border: '#2E7D32',
    hoverBg: '#DCF0DD',
    labelEn: 'Validated, profile complete',
    labelMr: 'पडताळणी झाली, प्रोफाइल पूर्ण',
  },
  validated_incomplete: {
    bg: '#E0F2F1',
    border: '#00796B',
    hoverBg: '#D0EBE8',
    labelEn: 'Validated, gaps remain',
    labelMr: 'पडताळणी झाली, काही माहिती थोडी',
  },
  needs_review: {
    bg: '#FAFAF8',
    border: '#F9A825',
    hoverBg: '#F2F2EE',
    labelEn: 'Pending data / validation',
    labelMr: 'माहिती / पडताळणी बाकी',
  },
  ready_to_validate: {
    bg: '#E3F2FD',
    border: '#1565C0',
    hoverBg: '#D4E8FC',
    labelEn: 'Profile complete, validate',
    labelMr: 'प्रोफाइल पूर्ण, पडताळणी करा',
  },
} as const;

export type VoterListRowCategory = keyof typeof VOTER_LIST_ROW;

// Voter status display config
export const VOTER_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Active':   { bg: '#E8F5E9', color: '#1B5E20' },
  'मयत':     { bg: '#FFEBEE', color: '#B71C1C' },
  'दुबार':   { bg: '#FFF8E1', color: '#E65100' },
  'बेपत्ता': { bg: '#ECEFF1', color: '#37474F' },
};
