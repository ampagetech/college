
import { Admission } from '@/types/admission';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils'; // Ensure this accepts Intl.DateTimeFormatOptions

interface AdmissionDetailsDisplayProps {
  admission: Admission;
}

const DetailItem: React.FC<{
  label: string;
  value?: string | number | null;
  isBadge?: boolean;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined;
}> = ({ label, value, isBadge, badgeVariant }) => {
  if (value === null || typeof value === 'undefined' || value === '') return null;

  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</h3>
      {isBadge ? (
        <Badge variant={badgeVariant || 'secondary'} className="text-sm mt-1">
          {String(value)}
        </Badge>
      ) : (
        <p className="text-md text-gray-800 dark:text-gray-200">{String(value)}</p>
      )}
    </div>
  );
};

const AdmissionDetailsDisplay: React.FC<AdmissionDetailsDisplayProps> = ({ admission }) => {
  if (!admission.admission_ref) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admission Not Found</CardTitle>
          <CardDescription>The requested admission details could not be loaded.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        <DetailItem label="Admission Reference" value={admission.admission_ref} />

        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</h3>
          <StatusBadge status={admission.status} type="admission" className="text-md mt-1 py-1 px-2" />
        </div>

        <DetailItem label="Admission Date" value={formatDate(admission.admission_date)} />

        <DetailItem
          label="Student Name"
          value={`${admission.user?.first_name || ''} ${admission.user?.last_name || ''}`.trim()}
        />
        <DetailItem label="Student Email" value={admission.user?.email} />

        <DetailItem label="Course" value={admission.course?.name} />
        <DetailItem label="Course Code" value={admission.course?.code} isBadge />
        <DetailItem label="Degree Type" value={admission.course?.degree_type} />
        <DetailItem label="Faculty" value={admission.course?.faculty?.name} />
        <DetailItem label="Academic Session" value={admission.academic_session?.session_name} />

        <DetailItem label="Offer Expires On" value={formatDate(admission.offer_expires_at)} />
        <DetailItem label="Acceptance Deadline" value={formatDate(admission.acceptance_deadline)} />

        <DetailItem label="Record Created" value={formatDate(admission.created_at, dateTimeOptions)} />
        <DetailItem label="Last Updated" value={formatDate(admission.updated_at, dateTimeOptions)} />
      </div>

      {/* Placeholder for actions like "Pay Acceptance Fee" if needed */}
    </div>
  );
};

export default AdmissionDetailsDisplay;