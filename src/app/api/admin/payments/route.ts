// src/app/api/admin/payments/route.ts

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No caching at all
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';
import { AdminPaymentView, PaymentStatus, Payment } from '@/types/payment'; // Make sure Fee is imported

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  const consolePrefix = '[API GET /api/admin/payments]';
  const timestamp = new Date().toISOString();
  console.log(`${consolePrefix} [${timestamp}] Fresh request received - NO CACHE`);

  const headers = new Headers({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Timestamp': timestamp
  });

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  if (String(token.role).toLowerCase() !== ROLES.ADMIN.toLowerCase()) {
    console.warn(`${consolePrefix} Forbidden: User ${token.sub} with role ${token.role} is not an admin.`);
    return NextResponse.json({ error: 'Forbidden: You do not have permission to access this resource.' }, { status: 403, headers });
  }

  console.log(`${consolePrefix} [${timestamp}] Admin user ${token.sub} authenticated.`);

  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString());
  const offset = (page - 1) * limit;

  const statusFilterRaw = searchParams.get('status');
  const statusFilter = statusFilterRaw && statusFilterRaw !== 'ALL' && statusFilterRaw !== '' ? statusFilterRaw as PaymentStatus : null;
  
  // Use fee_id from types
  const feeIdFilterRaw = searchParams.get('fee_id'); 
  const feeIdFilter = feeIdFilterRaw && feeIdFilterRaw !== 'ALL' && feeIdFilterRaw !== '' ? feeIdFilterRaw : null;
  
  // New filter from types
  const feeNameSearch = searchParams.get('feeNameSearch')?.trim().toLowerCase();

  const userSearch = searchParams.get('userSearch')?.trim().toLowerCase();
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const sortBy = searchParams.get('sortBy') || 'payment_date'; 
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const ascending = sortOrder === 'asc';

  try {
    console.log(`${consolePrefix} [${timestamp}] Building FRESH query with filters:`, { 
      status: statusFilter, fee_id: feeIdFilter, feeNameSearch, userSearch, dateFrom, dateTo, page, limit, sortBy, sortOrder 
    });
    
    let baseQuery = supabase
      .from('payments')
      .select('id, amount, fee_id, payment_date, status, receipt_url, receipt_filename, transaction_reference, admin_comment, created_at, updated_at, processed_by_admin_id, processed_at, user_id', { count: 'exact' });

    if (statusFilter) {
      baseQuery = baseQuery.eq('status', statusFilter);
    }
    
    // Filter by specific fee_id if provided (and not also using feeNameSearch, typically these would be exclusive in UI)
    if (feeIdFilter) {
      console.log(`${consolePrefix} [${timestamp}] Applying fee_id filter: ${feeIdFilter}`);
      baseQuery = baseQuery.eq('fee_id', feeIdFilter);
    }
    
    if (dateFrom) {
      baseQuery = baseQuery.gte('payment_date', new Date(dateFrom).toISOString());
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setUTCHours(23, 59, 59, 999);
      baseQuery = baseQuery.lte('payment_date', endDate.toISOString());
    }

    // User search and fee name search will be applied after joins
    // Sorting will also be refined after joins for joined fields

    // Initial sorting for pagination
    if (!sortBy.startsWith('user.') && !sortBy.startsWith('fees.')) {
      const validPaymentSortColumns: (keyof Payment)[] = ['id', 'fee_id', 'amount', 'payment_date', 'status', 'created_at', 'updated_at'];
      if (validPaymentSortColumns.includes(sortBy as keyof Payment)) {
        baseQuery = baseQuery.order(sortBy as keyof Payment, { ascending });
      } else {
        baseQuery = baseQuery.order('payment_date', { ascending: false });
      }
    } else {
      baseQuery = baseQuery.order('payment_date', { ascending: false }); // Default for joined sorts
    }

    // If feeNameSearch is active, we might need to fetch more initial payments
    // if the fee name filter is applied *after* pagination.
    // For simplicity here, pagination applies first, then feeNameSearch on that page.
    // This could mean fewer than 'limit' items if feeNameSearch filters many out.
    // A more complex approach would filter by feeNameSearch in the DB.
    baseQuery = baseQuery.range(offset, offset + limit - 1);

    const { data: paymentsData, error: paymentsError, count: initialCount } = await baseQuery;

    if (paymentsError) {
      console.error(`${consolePrefix} [${timestamp}] Payments fetch ERROR:`, paymentsError);
      throw paymentsError;
    }

    console.log(`${consolePrefix} [${timestamp}] Got ${paymentsData.length || 0} payments initially (pre-join filtering). Initial total count: ${initialCount}`);
    
    let finalPayments: AdminPaymentView[] = [];
    const totalItems = initialCount || 0;
    
    if (paymentsData && paymentsData.length > 0) {
      const user_ids = Array.from(new Set(paymentsData.map(p => p.user_id).filter(id => id != null))) as string[];
      const fee_ids = Array.from(new Set(paymentsData.map(p => p.fee_id).filter(id => id != null))) as string[];
      
      const [usersResponse, feesResponse] = await Promise.all([
        user_ids.length > 0 ? supabase.from('users').select('id, email, first_name, last_name, role').in('id', user_ids) : Promise.resolve({ data: [], error: null }),
        fee_ids.length > 0 ? supabase.from('fees').select('id, name, description, amount, is_active').in('id', fee_ids) : Promise.resolve({ data: [], error: null })
      ]);

      const { data: usersData, error: usersError } = usersResponse;
      const { data: feesData, error: feesError } = feesResponse;
      
      if (usersError) throw usersError;
      if (feesError) throw feesError;
      
      let combinedPayments = paymentsData.map(payment => {
        const user = usersData.find(u => u.id === payment.user_id);
        const fee = feesData.find(f => f.id === payment.fee_id);
        return {
          ...payment,
          user: user || null, // As per PaymentAssociatedUser structure, should be object or null
          fees: fee || null
        } as AdminPaymentView; // Cast carefully, ensure user object matches PaymentAssociatedUser
      });
      
      // Apply userSearch filter
      if (userSearch) {
        combinedPayments = combinedPayments.filter(p => {
          const pUser = p.user as any; // For easier access
          return p.transaction_reference?.toLowerCase().includes(userSearch) ||
                 pUser?.email?.toLowerCase().includes(userSearch) ||
                 pUser?.first_name?.toLowerCase().includes(userSearch) ||
                 pUser?.last_name?.toLowerCase().includes(userSearch);
        });
      }
      
      // Apply feeNameSearch filter
      if (feeNameSearch) {
        combinedPayments = combinedPayments.filter(p => 
            p.fees?.name.toLowerCase().includes(feeNameSearch)
        );
      }
      
      finalPayments = combinedPayments;

      // If feeNameSearch or userSearch active, the totalItems count might need adjustment
      // For now, we'll base totalPages on initialCount and let client side see fewer items on a page
      // A more accurate totalItems for pagination would require more complex DB query or counting after filtering.
      // If post-filtering reduces items, and this is the only source of truth for totalItems:
      // totalItems = finalPayments.length; // This would be if NOT paginating from DB first.
      // But since we are, initialCount is more about overall potential items.

      // Apply sorting for joined fields
      if (sortBy.startsWith('user.')) {
        const userField = sortBy.split('.')[1] as keyof NonNullable<AdminPaymentView['user']>;
        finalPayments.sort((a, b) => {
          const aVal = (a.user[userField] as string).toLowerCase() || '';
          const bVal = (b.user[userField] as string).toLowerCase() || '';
          return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      } else if (sortBy === 'fees.name') { 
        finalPayments.sort((a, b) => {
            const aVal = a.fees?.name.toLowerCase() || '';
            const bVal = b.fees?.name.toLowerCase() || '';
            return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }
    }

    const totalPages = Math.ceil(totalItems / limit);

    console.log(`${consolePrefix} [${timestamp}] ✅ FINAL SUCCESS: Returning ${finalPayments.length} payments. Total potential items: ${totalItems}`);
    
    return NextResponse.json({
      payments: finalPayments,
      page,
      limit,
      totalPages,
      totalItems,
      timestamp,
    }, { headers });

  } catch (error: any) {
    console.error(`${consolePrefix} [${timestamp}] ❌ GENERAL ERROR:`, error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch payments',
      timestamp 
    }, { status: 500, headers });
  }
}