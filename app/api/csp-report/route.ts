/**
 * CSP Violation Reporting Endpoint
 * Handles Content Security Policy violation reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCSPViolation } from '../../../src/utils/secureCSP';

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    
    // Log the CSP violation
    handleCSPViolation(report);
    
    // In production, you might want to:
    // 1. Store violations in a database
    // 2. Send alerts for critical violations
    // 3. Aggregate violation statistics
    
    console.log('CSP Violation Report received:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      violation: report
    });
    
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error('Error processing CSP violation report:', error);
    return NextResponse.json(
      { error: 'Failed to process report' }, 
      { status: 400 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}