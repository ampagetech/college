// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admin\admissions\create\page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import { ROLES, PATHS } from '@/lib/constants';
import ManageAdmissionForm from '@/components/admin/admissions/ManageAdmissionForm'; // We'll create this
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchFormDataForAdmission } from '@/lib/data/admin'; // A new data fetching function

// This page is for creating a new admission record.
// It will likely involve selecting a user (student), a course, and an academic session.

export default async function CreateAdmissionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(PATHS.SIGNIN);
  }
  if (session.user.role !== ROLES.ADMIN) {
    redirect(PATHS.UNAUTHORIZED);
  }

  // Fetch necessary data for the form (e.g., list of users, courses, academic sessions)
  // This function will fetch data required for dropdowns in the ManageAdmissionForm
  const formData = await fetchFormDataForAdmission();

  if (!formData) {
    // Handle error state, e.g., redirect or show an error message
    // This could happen if fetching users, courses, or sessions fails
    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Error Loading Form Data</CardTitle>
                    <CardDescription>
                        Could not load necessary data to create an admission. Please try again later.
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
          <CardTitle className="text-2xl font-bold">Create New Admission</CardTitle>
          <CardDescription>
            Fill in the details below to create a new admission record for a student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManageAdmissionForm
            mode="create"
            users={formData.users}
            courses={formData.courses}
            academicSessions={formData.academicSessions}
          />
        </CardContent>
      </Card>
    </div>
  );
}