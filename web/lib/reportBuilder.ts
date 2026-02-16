import { SupabaseClient } from '@supabase/supabase-js';

export type ReportField = {
  table: 'master_voters' | 'voter_profiles' | 'families' | 'workers' | 'employees' | 'villages';
  column: string;
  alias?: string;
};

export type ReportFilter = {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'like' | 'is' | 'not';
  value: any;
};

export type ReportConfig = {
  fields: string[]; // Array of field names like 'name', 'booth_number', 'status'
  filters: ReportFilter[];
  groupBy?: string[];
  sortBy?: { field: string; order: 'asc' | 'desc' };
  limit?: number;
};

// Available fields for custom reports
export const AVAILABLE_FIELDS = {
  master_voters: [
    { key: 'name_marathi', label: 'मराठी नाव / Marathi Name', type: 'text' },
    { key: 'name_english', label: 'English Name', type: 'text' },
    { key: 'voter_id', label: 'Voter ID', type: 'text' },
    { key: 'booth_number', label: 'Booth Number', type: 'number' },
    { key: 'serial_number', label: 'Serial Number', type: 'number' },
    { key: 'age', label: 'Age', type: 'number' },
    { key: 'gender', label: 'Gender', type: 'text' },
    { key: 'caste', label: 'Caste', type: 'text' },
    { key: 'assembly_constituency', label: 'Assembly Constituency', type: 'text' },
    { key: 'created_at', label: 'Import Date', type: 'date' },
  ],
  voter_profiles: [
    { key: 'mobile', label: 'Mobile', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'village', label: 'Village', type: 'text' },
    { key: 'address_marathi', label: 'Address (Marathi)', type: 'text' },
    { key: 'aadhaar_masked', label: 'Aadhaar (Masked)', type: 'text' },
  ],
};

export const OPERATORS = [
  { value: '=', label: 'Equals (=)' },
  { value: '!=', label: 'Not Equals (≠)' },
  { value: '>', label: 'Greater Than (>)' },
  { value: '<', label: 'Less Than (<)' },
  { value: '>=', label: 'Greater Than or Equal (≥)' },
  { value: '<=', label: 'Less Than or Equal (≤)' },
  { value: 'in', label: 'In (list)' },
  { value: 'like', label: 'Like (pattern)' },
  { value: 'is', label: 'Is (null/true/false)' },
  { value: 'not', label: 'Not (null)' },
];

/**
 * Build a select clause from field list
 */
function buildSelectClause(fields: string[]): string {
  if (fields.length === 0) {
    return '*';
  }
  
  // Map fields to include related tables
  const selectParts: string[] = [];
  
  fields.forEach(field => {
    // Check if field belongs to voter_profiles
    const profileField = AVAILABLE_FIELDS.voter_profiles.find(f => f.key === field);
    if (profileField) {
      selectParts.push(`voter_profiles(${field})`);
    } else {
      // Assume it's from master_voters
      selectParts.push(field);
    }
  });
  
  // Always include ID for linking
  if (!selectParts.includes('id')) {
    selectParts.unshift('id');
  }
  
  // Join profile by default
  if (selectParts.some(s => s.startsWith('voter_profiles('))) {
    // Ensure voter_profiles is properly joined
    return `*, voter_profiles(*)`;
  }
  
  return selectParts.join(', ');
}

/**
 * Apply filter to query
 */
function applyFilter(query: any, filter: ReportFilter): any {
  const { field, operator, value } = filter;
  
  switch (operator) {
    case '=':
      return query.eq(field, value);
    case '!=':
      return query.neq(field, value);
    case '>':
      return query.gt(field, value);
    case '<':
      return query.lt(field, value);
    case '>=':
      return query.gte(field, value);
    case '<=':
      return query.lte(field, value);
    case 'in':
      // Value should be an array
      const values = Array.isArray(value) ? value : value.split(',').map((v: string) => v.trim());
      return query.in(field, values);
    case 'like':
      return query.like(field, `%${value}%`);
    case 'is':
      return query.is(field, value);
    case 'not':
      return query.not(field, value);
    default:
      return query;
  }
}

/**
 * Build and execute a custom report query
 */
export async function executeReport(
  supabase: SupabaseClient,
  config: ReportConfig
): Promise<{ data: any[]; count: number; executionTime: number }> {
  const startTime = Date.now();
  
  try {
    // Start with master_voters as base table
    let query = supabase
      .from('master_voters')
      .select(buildSelectClause(config.fields), { count: 'exact' });
    
    // Apply filters
    config.filters.forEach(filter => {
      query = applyFilter(query, filter);
    });
    
    // Apply sorting
    if (config.sortBy) {
      query = query.order(config.sortBy.field, { ascending: config.sortBy.order === 'asc' });
    }
    
    // Apply limit
    if (config.limit) {
      query = query.limit(config.limit);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      data: data || [],
      count: count || 0,
      executionTime,
    };
  } catch (error) {
    console.error('Report execution error:', error);
    throw error;
  }
}

/**
 * Validate report configuration
 */
export function validateConfig(config: ReportConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if fields are provided
  if (!config.fields || config.fields.length === 0) {
    errors.push('At least one field must be selected');
  }
  
  // Validate filters
  if (config.filters) {
    config.filters.forEach((filter, idx) => {
      if (!filter.field) {
        errors.push(`Filter ${idx + 1}: Field is required`);
      }
      if (!filter.operator) {
        errors.push(`Filter ${idx + 1}: Operator is required`);
      }
      if (filter.value === undefined || filter.value === null) {
        errors.push(`Filter ${idx + 1}: Value is required`);
      }
    });
  }
  
  // Validate limit
  if (config.limit && (config.limit < 1 || config.limit > 10000)) {
    errors.push('Limit must be between 1 and 10000');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert report data to CSV
 */
export function convertToCSV(data: any[], fields: string[]): string {
  if (data.length === 0) {
    return '';
  }
  
  // Create header row
  const headers = fields.map(field => {
    const masterField = AVAILABLE_FIELDS.master_voters.find(f => f.key === field);
    const profileField = AVAILABLE_FIELDS.voter_profiles.find(f => f.key === field);
    return (masterField || profileField)?.label || field;
  });
  
  const csvHeader = headers.join(',') + '\n';
  
  // Create data rows
  const csvRows = data.map(row => {
    return fields.map(field => {
      // Check if field is in voter_profiles
      let value = row[field];
      if (!value && row.voter_profiles) {
        value = row.voter_profiles[field];
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  }).join('\n');
  
  return csvHeader + csvRows;
}
