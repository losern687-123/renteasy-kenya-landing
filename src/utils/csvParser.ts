// CSV Parser Utilities for Bulk Operations

export interface ParsedCSV<T = Record<string, string>> {
  headers: string[];
  rows: T[];
  errors: CSVError[];
}

export interface CSVError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface TenantCSVRow {
  name: string;
  email: string;
  phone: string;
  property_name: string;
  rent_amount: string;
  due_date: string;
}

export interface PropertyCSVRow {
  property_name: string;
  location: string;
  rent_amount: string;
  bedrooms?: string;
  bathrooms?: string;
  property_type?: string;
}

export interface PaymentCSVRow {
  tenant_name: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference: string;
}

/**
 * Parse CSV content into structured data
 */
export function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(line => parseCSVLine(line));
  
  return { headers, rows };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Convert parsed CSV to typed objects
 */
export function csvToObjects<T>(parsed: { headers: string[]; rows: string[][] }): T[] {
  return parsed.rows.map(row => {
    const obj: Record<string, string> = {};
    parsed.headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as T;
  });
}

/**
 * Validate tenant CSV row
 */
export function validateTenantRow(
  row: TenantCSVRow, 
  rowIndex: number,
  existingPropertyNames: string[]
): CSVError[] {
  const errors: CSVError[] = [];
  
  // Name validation
  if (!row.name || row.name.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'name', message: 'Name is required' });
  } else if (row.name.length > 100) {
    errors.push({ row: rowIndex, field: 'name', message: 'Name must be less than 100 characters', value: row.name });
  }
  
  // Email validation (optional but must be valid if provided)
  if (row.email && row.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push({ row: rowIndex, field: 'email', message: 'Invalid email format', value: row.email });
    }
  }
  
  // Phone validation (Kenya format)
  if (!row.phone || row.phone.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'phone', message: 'Phone is required' });
  } else {
    const cleanPhone = row.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !['07', '01'].includes(cleanPhone.substring(0, 2))) {
      errors.push({ row: rowIndex, field: 'phone', message: 'Phone must be 10 digits starting with 07 or 01', value: row.phone });
    }
  }
  
  // Property name validation
  if (!row.property_name || row.property_name.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'property_name', message: 'Property name is required' });
  } else if (!existingPropertyNames.map(n => n.toLowerCase()).includes(row.property_name.toLowerCase())) {
    errors.push({ row: rowIndex, field: 'property_name', message: 'Property does not exist', value: row.property_name });
  }
  
  // Rent amount validation
  const rentAmount = parseFloat(row.rent_amount);
  if (isNaN(rentAmount) || rentAmount <= 0) {
    errors.push({ row: rowIndex, field: 'rent_amount', message: 'Rent amount must be a positive number', value: row.rent_amount });
  }
  
  // Due date validation
  const dueDate = parseInt(row.due_date);
  if (isNaN(dueDate) || dueDate < 1 || dueDate > 31) {
    errors.push({ row: rowIndex, field: 'due_date', message: 'Due date must be between 1 and 31', value: row.due_date });
  }
  
  return errors;
}

/**
 * Validate property CSV row
 */
export function validatePropertyRow(row: PropertyCSVRow, rowIndex: number): CSVError[] {
  const errors: CSVError[] = [];
  
  // Property name validation
  if (!row.property_name || row.property_name.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'property_name', message: 'Property name is required' });
  }
  
  // Location validation
  if (!row.location || row.location.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'location', message: 'Location is required' });
  }
  
  // Rent amount validation
  const rentAmount = parseFloat(row.rent_amount);
  if (isNaN(rentAmount) || rentAmount <= 0) {
    errors.push({ row: rowIndex, field: 'rent_amount', message: 'Rent amount must be a positive number', value: row.rent_amount });
  }
  
  // Bedrooms validation (optional)
  if (row.bedrooms && row.bedrooms.trim()) {
    const bedrooms = parseInt(row.bedrooms);
    if (isNaN(bedrooms) || bedrooms < 0) {
      errors.push({ row: rowIndex, field: 'bedrooms', message: 'Bedrooms must be a positive number', value: row.bedrooms });
    }
  }
  
  // Bathrooms validation (optional)
  if (row.bathrooms && row.bathrooms.trim()) {
    const bathrooms = parseInt(row.bathrooms);
    if (isNaN(bathrooms) || bathrooms < 0) {
      errors.push({ row: rowIndex, field: 'bathrooms', message: 'Bathrooms must be a positive number', value: row.bathrooms });
    }
  }
  
  return errors;
}

/**
 * Validate payment CSV row
 */
export function validatePaymentRow(row: PaymentCSVRow, rowIndex: number): CSVError[] {
  const errors: CSVError[] = [];
  
  // Tenant name validation
  if (!row.tenant_name || row.tenant_name.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'tenant_name', message: 'Tenant name is required' });
  }
  
  // Amount validation
  const amount = parseFloat(row.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push({ row: rowIndex, field: 'amount', message: 'Amount must be a positive number', value: row.amount });
  }
  
  // Payment date validation
  if (!row.payment_date || row.payment_date.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'payment_date', message: 'Payment date is required' });
  } else {
    const date = new Date(row.payment_date);
    if (isNaN(date.getTime())) {
      errors.push({ row: rowIndex, field: 'payment_date', message: 'Invalid date format (use YYYY-MM-DD)', value: row.payment_date });
    }
  }
  
  // Payment method validation
  const validMethods = ['mpesa', 'm-pesa', 'bank_transfer', 'bank', 'cash', 'cheque', 'check'];
  if (row.payment_method && !validMethods.includes(row.payment_method.toLowerCase())) {
    errors.push({ row: rowIndex, field: 'payment_method', message: 'Invalid payment method', value: row.payment_method });
  }
  
  return errors;
}

/**
 * Generate sample CSV content for download
 */
export function generateSampleCSV(type: 'tenants' | 'properties' | 'payments'): string {
  const samples = {
    tenants: `name,email,phone,property_name,rent_amount,due_date
John Doe,john@example.com,0712345678,Apartment 1A,25000,5
Jane Smith,jane@example.com,0723456789,House 2B,35000,1
Peter Kamau,peter@example.com,0111222333,Studio 3C,15000,15`,
    
    properties: `property_name,location,rent_amount,bedrooms,bathrooms,property_type
Apartment 1A,Westlands,25000,2,2,apartment
House 2B,Karen,50000,3,3,house
Studio 3C,Kilimani,15000,1,1,apartment`,
    
    payments: `tenant_name,amount,payment_date,payment_method,reference
John Doe,25000,2025-01-15,mpesa,ABC123XYZ
Jane Smith,35000,2025-01-10,bank_transfer,REF456
Peter Kamau,15000,2025-01-20,cash,CASH001`,
  };
  
  return samples[type];
}

/**
 * Download CSV content as file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
