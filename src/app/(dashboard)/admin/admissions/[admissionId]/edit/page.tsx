// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admin\admissions\[admissionId]\edit\page.tsx
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import { ROLES, PATHS } from '@/lib/constants';
import ManageAdmissionForm from '@/components/admin/admissions/ManageAdmissionForm'; // Reusing the form component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAdmissionForEditing, fetchFormDataForAdmission } from '@/lib/data/admin'; // New data fetching functions

interface EditAdmissionPageProps {
  params: {
    admissionId: string;
  };
}

export default async function EditAdmissionPage({ params }: EditAdmissionPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(PATHS.SIGNIN);
  }
  if (session.user.role !== ROLES.ADMIN) {
    redirect(PATHS.UNAUTHORIZED);
  }

  const { admissionId } = params;

  if (!admissionId) {
    notFound(); // Should not happen if route matching works
  }

  // Fetch the existing admission data to pre-fill the form
  const existingAdmission = await fetchAdmissionForEditing(admissionId);

  // Fetch necessary data for form dropdowns (users, courses, sessions)
  // Even for edit, you might want to show these if admin can change them,
  // or at least display the selected ones.
  const formData = await fetchFormDataForAdmission();

  if (!existingAdmission) {
    notFound(); // Admission to edit was not found
  }

  if (!formData) {
    // Handle error state for form auxiliary data
    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Error Loading Form Data</CardTitle>
                    <CardDescription>
                        Could not load necessary data to edit the admission. Please try again later.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Admission Record</CardTitle>
          <CardDescription>
            Modify the details for admission reference: {existingAdmission.admission_ref}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManageAdmissionForm
            mode="edit"
            initialData={existingAdmission} // Pass existing data to the form
            admissionId={admissionId} // Pass ID for the update API call
            users={formData.users} // For user selection/display
            courses={formData.courses} // For course selection/display
            academicSessions={formData.academicSessions} // For session selection/display
          />
        </CardContent>
      </Card>
    </div>
  );
}