// src/components/admissions/sections/FeeSchedule.tsx
import { createClient } from '@/lib/supabase/server';

// Helper sub-component to render a single table (to avoid repeating code)
const FeeTable = ({ title, fees, total }: { title: string; fees: any[]; total?: number }) => {
  if (!fees || fees.length === 0) return null;

  const formatCurrency = (amount: number) => `NGN ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold mb-2">{title}</h3>
      <table className="w-full text-left border-collapse text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2 pr-4 font-semibold">Description</th>
            <th className="py-2 pl-4 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((fee, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2 pr-4">{fee.name}</td>
              <td className="py-2 pl-4 text-right">{formatCurrency(fee.amount)}</td>
            </tr>
          ))}
        </tbody>
        {total !== undefined && (
          <tfoot className="font-bold">
            <tr>
              <td className="py-2 pr-4 text-right">SUB-TOTAL</td>
              <td className="py-2 pl-4 text-right">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

// Main async component that fetches and organizes all fee data
export default async function FeeSchedule() {
  const supabase = createClient();

  // 1. Fetch all active fees in a single query
  const { data: allFees, error } = await supabase
    .from('fees')
    .select('name, amount, frequency, is_optional')
    .eq('is_active', true);

  if (error) {
    console.error("Error fetching fee schedule:", error);
    return <div className="text-red-500">Could not load fee schedule.</div>;
  }

  if (!allFees || allFees.length === 0) {
    return null; // Don't render anything if no fees are found
  }

  // 2. Group the fees in JavaScript based on your SQL logic
  const compulsoryPerSemester = allFees.filter(
    (fee) => fee.frequency === 'per_semester' && fee.is_optional === false
  );
  const compulsoryOnce = allFees.filter(
    (fee) => fee.frequency === 'once_on_registration' && fee.is_optional === false
  );
  const optionalFees = allFees.filter((fee) => fee.is_optional === true);

  // 3. Calculate totals for each group
  const totalCompulsoryPerSemester = compulsoryPerSemester.reduce((sum, fee) => sum + fee.amount, 0);
  const totalCompulsoryOnce = compulsoryOnce.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <section>
      {/* SECTION A: COMPULSORY FEES */}
      <h2 className="text-lg font-semibold mb-3 uppercase border-b pb-1">
        A) COMPULSORY FEES
      </h2>
      <FeeTable
        title="(i) Per Semester"
        fees={compulsoryPerSemester}
        total={totalCompulsoryPerSemester}
      />
      <FeeTable
        title="(ii) Once on Registration"
        fees={compulsoryOnce}
        total={totalCompulsoryOnce}
      />
      
      {/* SECTION B: OPTIONAL FEES */}
      {optionalFees.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3 uppercase border-b pb-1">
            B) OPTIONAL FEES
          </h2>
          <FeeTable
            title="Accommodation and Others"
            fees={optionalFees}
          />
        </div>
      )}
    </section>
  );
}