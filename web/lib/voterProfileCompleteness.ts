import { VOTER_LIST_ROW, type VoterListRowCategory } from './colors';

/** Order for legend on voters list (matches category priority for clarity). */
export const VOTER_LIST_LEGEND_ORDER: VoterListRowCategory[] = [
  'inactive_record',
  'non_voter',
  'validated_complete',
  'validated_incomplete',
  'needs_review',
  'ready_to_validate',
];

/** Flattened row shape from GET /api/voters/list */
export type VoterListRowInput = {
  name_marathi?: string;
  name_english?: string;
  first_name?: string;
  first_name_marathi?: string | null;
  middle_name?: string;
  surname?: string;
  mobile?: string;
  status?: string;
  village?: string;
  is_non_voter?: boolean | null;
  data_validated?: boolean | null;
  dob?: string | null;
  address_marathi?: string | null;
  address_english?: string | null;
  education?: string | null;
  occupation?: string | null;
  caste_category?: string | null;
  ration_card_type?: string | null;
};

const FIELD_LABELS: Record<string, string> = {
  mobile: 'Mobile / मोबाईल',
  dob: 'Date of birth / जन्मतारीख',
  village: 'Village / गाव',
  name: 'Name (Marathi or English) / नाव',
  address: 'Address (Marathi or English) / पत्ता',
  caste_category: 'Caste category / प्रवर्ग',
  ration_card_type: 'Ration card type / रेशन कार्ड',
  education: 'Education / शिक्षण',
  occupation: 'Occupation / व्यवसाय',
};

function nonEmpty(v: string | null | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function hasName(row: VoterListRowInput): boolean {
  return (
    nonEmpty(row.name_marathi) ||
    nonEmpty(row.name_english) ||
    nonEmpty(row.first_name_marathi) ||
    nonEmpty([row.first_name, row.middle_name, row.surname].filter(Boolean).join(' ').trim())
  );
}

function hasAddress(row: VoterListRowInput): boolean {
  return nonEmpty(row.address_marathi) || nonEmpty(row.address_english);
}

/**
 * Core fields drive “profile complete” for row colour. Extended fields show in tooltip only.
 */
export function getMissingProfileFields(row: VoterListRowInput): {
  requiredMissing: { key: string; label: string }[];
  recommendedMissing: { key: string; label: string }[];
} {
  const requiredMissing: { key: string; label: string }[] = [];
  if (!nonEmpty(row.mobile)) requiredMissing.push({ key: 'mobile', label: FIELD_LABELS.mobile });
  if (row.dob == null || !nonEmpty(String(row.dob))) requiredMissing.push({ key: 'dob', label: FIELD_LABELS.dob });
  if (!nonEmpty(row.village)) requiredMissing.push({ key: 'village', label: FIELD_LABELS.village });
  if (!hasName(row)) requiredMissing.push({ key: 'name', label: FIELD_LABELS.name });
  if (!hasAddress(row)) requiredMissing.push({ key: 'address', label: FIELD_LABELS.address });

  const recommendedMissing: { key: string; label: string }[] = [];
  if (!nonEmpty(row.caste_category)) {
    recommendedMissing.push({ key: 'caste_category', label: FIELD_LABELS.caste_category });
  }
  if (!nonEmpty(row.ration_card_type)) {
    recommendedMissing.push({ key: 'ration_card_type', label: FIELD_LABELS.ration_card_type });
  }
  if (!nonEmpty(row.education)) recommendedMissing.push({ key: 'education', label: FIELD_LABELS.education });
  if (!nonEmpty(row.occupation)) recommendedMissing.push({ key: 'occupation', label: FIELD_LABELS.occupation });

  return { requiredMissing, recommendedMissing };
}

export function isCoreProfileComplete(row: VoterListRowInput): boolean {
  return getMissingProfileFields(row).requiredMissing.length === 0;
}

export function buildProfileGapsTooltip(
  requiredMissing: { label: string }[],
  recommendedMissing: { label: string }[]
): string {
  const lines: string[] = [];
  if (requiredMissing.length > 0) {
    lines.push('Required: ' + requiredMissing.map((x) => x.label).join('; '));
  }
  if (recommendedMissing.length > 0) {
    lines.push('Recommended: ' + recommendedMissing.map((x) => x.label).join('; '));
  }
  if (lines.length === 0) return 'Profile complete (core + recommended fields filled)';
  return lines.join('\n');
}

export function getVoterListRowStyle(row: VoterListRowInput): {
  category: VoterListRowCategory;
  background: string;
  borderLeft: string;
  hoverBackground: string;
  legendLabelEn: string;
  legendLabelMr: string;
} {
  const profileStatus = row.status?.trim() || 'Active';
  if (profileStatus !== 'Active') {
    const c = VOTER_LIST_ROW.inactive_record;
    return {
      category: 'inactive_record',
      background: c.bg,
      borderLeft: `4px solid ${c.border}`,
      hoverBackground: c.hoverBg,
      legendLabelEn: c.labelEn,
      legendLabelMr: c.labelMr,
    };
  }
  if (row.is_non_voter === true) {
    const c = VOTER_LIST_ROW.non_voter;
    return {
      category: 'non_voter',
      background: c.bg,
      borderLeft: `4px solid ${c.border}`,
      hoverBackground: c.hoverBg,
      legendLabelEn: c.labelEn,
      legendLabelMr: c.labelMr,
    };
  }

  const coreComplete = isCoreProfileComplete(row);
  const validated = row.data_validated === true;

  if (validated && coreComplete) {
    const c = VOTER_LIST_ROW.validated_complete;
    return {
      category: 'validated_complete',
      background: c.bg,
      borderLeft: `4px solid ${c.border}`,
      hoverBackground: c.hoverBg,
      legendLabelEn: c.labelEn,
      legendLabelMr: c.labelMr,
    };
  }
  if (validated && !coreComplete) {
    const c = VOTER_LIST_ROW.validated_incomplete;
    return {
      category: 'validated_incomplete',
      background: c.bg,
      borderLeft: `4px solid ${c.border}`,
      hoverBackground: c.hoverBg,
      legendLabelEn: c.labelEn,
      legendLabelMr: c.labelMr,
    };
  }
  if (!validated && !coreComplete) {
    const c = VOTER_LIST_ROW.needs_review;
    return {
      category: 'needs_review',
      background: c.bg,
      borderLeft: `4px solid ${c.border}`,
      hoverBackground: c.hoverBg,
      legendLabelEn: c.labelEn,
      legendLabelMr: c.labelMr,
    };
  }

  const c = VOTER_LIST_ROW.ready_to_validate;
  return {
    category: 'ready_to_validate',
    background: c.bg,
    borderLeft: `4px solid ${c.border}`,
    hoverBackground: c.hoverBg,
    legendLabelEn: c.labelEn,
    legendLabelMr: c.labelMr,
  };
}

const RECORD_PILL_TEXT: Record<VoterListRowCategory, string> = {
  inactive_record: 'Inactive',
  non_voter: 'Non-voter',
  validated_complete: 'Complete',
  validated_incomplete: 'Gaps',
  needs_review: 'Pending',
  ready_to_validate: 'Ready',
};

export function getVoterListRecordPill(row: VoterListRowInput): {
  text: string;
  tooltip: string;
  category: VoterListRowCategory;
} {
  const { requiredMissing, recommendedMissing } = getMissingProfileFields(row);
  const style = getVoterListRowStyle(row);
  return {
    text: RECORD_PILL_TEXT[style.category],
    tooltip: buildProfileGapsTooltip(requiredMissing, recommendedMissing),
    category: style.category,
  };
}
