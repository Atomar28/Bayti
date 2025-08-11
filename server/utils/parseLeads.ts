import csv from 'csv-parser';
import { Readable } from 'stream';
import XLSX from 'xlsx';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export interface ParsedLead {
  fullName: string;
  phoneE164: string;
  email?: string;
  notes?: string;
  custom?: Record<string, any>;
}

export interface ParseResult {
  leads: ParsedLead[];
  validLeads: number;
  totalRows: number;
  errors: string[];
}

// Detect column mappings from headers
export function detectColumns(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  const normalizeHeader = (header: string) => 
    header.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    
    // Name variations
    if (['name', 'fullname', 'customername', 'clientname', 'leadname'].includes(normalized)) {
      mappings.fullName = header;
    }
    
    // Phone variations
    if (['phone', 'phonenumber', 'mobile', 'cell', 'telephone', 'contact'].includes(normalized)) {
      mappings.phoneE164 = header;
    }
    
    // Email variations
    if (['email', 'emailaddress', 'mail'].includes(normalized)) {
      mappings.email = header;
    }
    
    // Notes variations
    if (['notes', 'comments', 'description', 'remarks'].includes(normalized)) {
      mappings.notes = header;
    }
  }
  
  return mappings;
}

// Parse phone number to E.164 format
function parsePhone(phone: string, defaultCountry: string = 'AE'): string | null {
  if (!phone || typeof phone !== 'string') return null;
  
  try {
    // Clean the phone number
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned) return null;
    
    // Parse with default country
    const parsed = parsePhoneNumber(cleaned, defaultCountry as any);
    
    if (parsed && parsed.isValid()) {
      return parsed.format('E.164');
    }
    
    return null;
  } catch {
    return null;
  }
}

// Parse CSV data
export function parseCSV(csvContent: string): ParseResult {
  const results: ParsedLead[] = [];
  const errors: string[] = [];
  let totalRows = 0;
  let headers: string[] = [];
  
  return new Promise((resolve) => {
    const stream = Readable.from([csvContent]);
    
    stream
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
      })
      .on('data', (row) => {
        totalRows++;
        
        try {
          const mappings = detectColumns(headers);
          
          // Extract data using mappings
          const fullName = row[mappings.fullName] || '';
          const phoneRaw = row[mappings.phoneE164] || '';
          const email = row[mappings.email] || '';
          const notes = row[mappings.notes] || '';
          
          // Parse phone number
          const phoneE164 = parsePhone(phoneRaw);
          
          if (!phoneE164) {
            errors.push(`Row ${totalRows}: Invalid phone number "${phoneRaw}"`);
            return;
          }
          
          if (!fullName.trim()) {
            errors.push(`Row ${totalRows}: Missing name`);
          }
          
          // Collect any additional custom fields
          const custom: Record<string, any> = {};
          const usedColumns = new Set(Object.values(mappings));
          
          for (const [key, value] of Object.entries(row)) {
            if (!usedColumns.has(key) && value) {
              custom[key] = value;
            }
          }
          
          results.push({
            fullName: fullName.trim(),
            phoneE164,
            email: email.trim() || undefined,
            notes: notes.trim() || undefined,
            custom: Object.keys(custom).length > 0 ? custom : undefined,
          });
          
        } catch (error) {
          errors.push(`Row ${totalRows}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })
      .on('end', () => {
        resolve({
          leads: results,
          validLeads: results.length,
          totalRows,
          errors,
        });
      })
      .on('error', (error) => {
        errors.push(`CSV parsing error: ${error.message}`);
        resolve({
          leads: results,
          validLeads: results.length,
          totalRows,
          errors,
        });
      });
  });
}

// Parse Excel data
export function parseExcel(buffer: Buffer): ParseResult {
  const results: ParsedLead[] = [];
  const errors: string[] = [];
  
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('No worksheets found in Excel file');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length === 0) {
      throw new Error('Excel file is empty');
    }
    
    const headers = data[0] as string[];
    const mappings = detectColumns(headers);
    const totalRows = data.length - 1; // Exclude header row
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1; // 1-based row number
      
      try {
        // Create row object from array
        const rowObj: Record<string, any> = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index] || '';
        });
        
        // Extract data using mappings
        const fullName = rowObj[mappings.fullName] || '';
        const phoneRaw = rowObj[mappings.phoneE164] || '';
        const email = rowObj[mappings.email] || '';
        const notes = rowObj[mappings.notes] || '';
        
        // Parse phone number
        const phoneE164 = parsePhone(String(phoneRaw));
        
        if (!phoneE164) {
          errors.push(`Row ${rowNum}: Invalid phone number "${phoneRaw}"`);
          continue;
        }
        
        if (!String(fullName).trim()) {
          errors.push(`Row ${rowNum}: Missing name`);
        }
        
        // Collect any additional custom fields
        const custom: Record<string, any> = {};
        const usedColumns = new Set(Object.values(mappings));
        
        for (const [key, value] of Object.entries(rowObj)) {
          if (!usedColumns.has(key) && value) {
            custom[key] = value;
          }
        }
        
        results.push({
          fullName: String(fullName).trim(),
          phoneE164,
          email: String(email).trim() || undefined,
          notes: String(notes).trim() || undefined,
          custom: Object.keys(custom).length > 0 ? custom : undefined,
        });
        
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      leads: results,
      validLeads: results.length,
      totalRows,
      errors,
    };
    
  } catch (error) {
    return {
      leads: [],
      validLeads: 0,
      totalRows: 0,
      errors: [`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}