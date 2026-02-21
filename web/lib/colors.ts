// Central color palette for the Voter Management Portal
// Primary = Congress Blue. Saffron/orange entirely avoided.

export const colors = {
  // Primary — Congress Blue
  primary:         '#0D47A1',
  primaryHover:    '#1565C0',
  primaryLight:    '#E3F0FF',

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
  textSecondary:   '#424242',
  textDisabled:    '#9E9E9E',
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

// Voter status display config
export const VOTER_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Active':   { bg: '#E8F5E9', color: '#1B5E20' },
  'मयत':     { bg: '#FFEBEE', color: '#B71C1C' },
  'दुबार':   { bg: '#FFF8E1', color: '#E65100' },
  'बेपत्ता': { bg: '#ECEFF1', color: '#37474F' },
};
