'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  FaTimes, FaSpinner, FaUser, FaUsers, FaGraduationCap, FaBookOpen, FaFileAlt, FaExternalLinkAlt,
  FaExclamationTriangle, FaSave, FaImage, FaComments
} from 'react-icons/fa';
import {
  getApplicationDetailsForReview,
  updateApplicationReview,
  updateDocumentSetReview
} from '@/app/(dashboard)/admin/documents/actions/documentActions';

// --- INTERFACES ---
interface Faculty { id: string; name: string; }
interface Course { id: string; name: string; faculty_id: string; }
interface TransformedDocument { id: string; document_type: string; file_path: string | null; public_url: string | null; original_filename: string | null; file_size: number | null; uploaded_at: string | null; }
interface ApplicationDocumentsRow { id: string; user_id: string; status: string; admin_comment: string | null; reviewed_at: string | null; }
interface FullApplicationDetails {
  id: string; user_id: string | null; surname: string; first_name: string; middle_name: string | null; gender: string; date_of_birth: string; marital_status: string; state_of_origin: string; lga: string; religion: string; address: string; phone_number: string; email: string; disability: string | null; health_challenge: string | null; guardian_name: string; guardian_address: string; guardian_occupation: string; guardian_relationship: string; guardian_phone_number: string; school_name: string; year_of_entry: number; year_of_graduation: number; qualification_obtained: string; jamb_registration_number: string; status: string; document_review_notes: string | null; first_choice_course_id: string | null; second_choice_course_id: string | null;
  applicant_documents: TransformedDocument[];
  application_documents_row: ApplicationDocumentsRow | null;
}
interface ApplicantDocumentReviewModalProps {
  isOpen: boolean; onClose: () => void; applicationId: string | null; onReviewComplete: () => void; faculties: Faculty[]; courses: Course[];
}

// --- HELPER FUNCTIONS ---
const formatDate = (dateString: string | null | undefined, includeTime: boolean = false): string => {
  if (!dateString) return 'N/A';
  try {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; }
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) { return dateString || 'N/A'; }
};
const formatDocumentTypeName = (type: string): string => {
  if (!type) return 'Unknown Document';
  const cleanType = type.replace(/_/g, ' ').replace('letter', ' Letter').replace('certificate', ' Certificate');
  return cleanType.replace(/\b\w/g, char => char.toUpperCase());
};
const displayValue = (value: string | number | null | undefined): JSX.Element | string => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return <span className="text-gray-500 italic">N/A</span>;
  }
  return String(value);
};
function ImagePreviewModal({ isOpen, onClose, imageUrl }: { isOpen: boolean; onClose: () => void; imageUrl: string | null; }): JSX.Element | null {
  if (!imageUrl) return null;
  return ( <Transition appear show={isOpen} as={Fragment}><Dialog as="div" className="relative z-[60]" onClose={onClose}><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-75" /></Transition.Child><div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"><Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white p-2 text-left align-middle shadow-xl transition-all"><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-medium">Document Preview</h3><button type="button" className="text-gray-400 hover:text-gray-600 p-2" onClick={onClose}><FaTimes size={24} /></button></div><div className="p-4 flex justify-center items-center bg-gray-50"><div className="relative max-w-full max-h-[80vh] overflow-auto"><Image src={imageUrl} alt="Document Preview" width={1200} height={800} style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }} className="rounded-lg shadow-lg" priority /></div></div></Dialog.Panel></Transition.Child></div></div></Dialog></Transition> );
}

// --- MAIN COMPONENT ---
export default function ApplicantDocumentReviewModal({
  isOpen, onClose, applicationId, onReviewComplete, faculties, courses
}: ApplicantDocumentReviewModalProps) {
  const [applicationDetails, setApplicationDetails] = useState<FullApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const [overallReviewNotes, setOverallReviewNotes] = useState('');
  const [overallAppStatus, setOverallAppStatus] = useState('');
  const [documentSetComment, setDocumentSetComment] = useState('');
  const [documentSetStatus, setDocumentSetStatus] = useState('');
  
  const [firstChoiceFacultyId, setFirstChoiceFacultyId] = useState('');
  const [firstChoiceCourseId, setFirstChoiceCourseId] = useState('');
  const [secondChoiceFacultyId, setSecondChoiceFacultyId] = useState('');
  const [secondChoiceCourseId, setSecondChoiceCourseId] = useState('');

  const [firstChoiceCourses, setFirstChoiceCourses] = useState<Course[]>([]);
  const [secondChoiceCourses, setSecondChoiceCourses] = useState<Course[]>([]);

  const handleOpenImagePreview = (url: string) => { setPreviewImageUrl(url); setIsImagePreviewOpen(true); };
  const handleCloseImagePreview = useCallback(() => { setIsImagePreviewOpen(false); setPreviewImageUrl(null); }, []);
  
  const resetState = useCallback(() => {
    setApplicationDetails(null); setError(null); setIsLoading(false); setIsSubmitting(false);
    setOverallReviewNotes(''); setOverallAppStatus(''); setDocumentSetComment(''); setDocumentSetStatus('');
    setFirstChoiceFacultyId(''); setFirstChoiceCourseId(''); setSecondChoiceFacultyId(''); setSecondChoiceCourseId('');
    handleCloseImagePreview();
  }, [handleCloseImagePreview]);
  
  useEffect(() => {
    if (firstChoiceFacultyId) {
      const filtered = courses.filter(c => c.faculty_id === firstChoiceFacultyId);
      setFirstChoiceCourses(filtered);
      if (firstChoiceCourseId && !filtered.some(c => c.id === firstChoiceCourseId)) { setFirstChoiceCourseId(''); }
    } else { setFirstChoiceCourses([]); }
  }, [firstChoiceFacultyId, courses, firstChoiceCourseId]);

  useEffect(() => {
    if (secondChoiceFacultyId) {
      const filtered = courses.filter(c => c.faculty_id === secondChoiceFacultyId);
      setSecondChoiceCourses(filtered);
      if (secondChoiceCourseId && !filtered.some(c => c.id === secondChoiceCourseId)) { setSecondChoiceCourseId(''); }
    } else { setSecondChoiceCourses([]); }
  }, [secondChoiceFacultyId, courses, secondChoiceCourseId]);

  const fetchApplicationDetails = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true); setError(null);
    const result = await getApplicationDetailsForReview(applicationId);
    if (result.success && result.data) {
      const details = result.data as FullApplicationDetails;
      setApplicationDetails(details);
      
      setOverallReviewNotes(details.document_review_notes || '');
      setOverallAppStatus(details.status || 'SUBMITTED');
      setDocumentSetComment(details.application_documents_row?.admin_comment || '');
      setDocumentSetStatus(details.application_documents_row?.status || 'pending_review');

      const firstCourse = courses.find(c => c.id === details.first_choice_course_id);
      const secondCourse = courses.find(c => c.id === details.second_choice_course_id);

      setFirstChoiceCourseId(details.first_choice_course_id || '');
      setFirstChoiceFacultyId(firstCourse?.faculty_id || '');
      setSecondChoiceCourseId(details.second_choice_course_id || '');
      setSecondChoiceFacultyId(secondCourse?.faculty_id || '');
    } else { setError(typeof result.error === 'string' ? result.error : 'An unknown error occurred.'); }
    setIsLoading(false);
  }, [applicationId, courses]);

  useEffect(() => {
    if (isOpen && applicationId) { fetchApplicationDetails(); } 
    else if (!isOpen) { resetState(); }
  }, [isOpen, applicationId, fetchApplicationDetails, resetState]);

  const handleSaveAllReviews = async (): Promise<void> => {
    if (!applicationId || !applicationDetails) {
      setError("Cannot save: Application details are not loaded.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create a list of promises to run.
      const promisesToRun = [];

      // 1. Add the main application review promise.
      promisesToRun.push(
        updateApplicationReview(applicationId, {
          status: overallAppStatus,
          notes: overallReviewNotes,
          firstChoiceCourseId,
          secondChoiceCourseId,
        })
      );

      // 2. Add the document review promise only if there are documents to review.
      const docRowId = applicationDetails.application_documents_row?.id;
      if (docRowId) {
        promisesToRun.push(
          updateDocumentSetReview(docRowId, {
            status: documentSetStatus,
            comment: documentSetComment,
          })
        );
      }

      // Run all promises and wait for results.
      const results = await Promise.allSettled(promisesToRun);

      // Check for any failed promises.
      const failedResult = results.find(
        (result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value?.success)
      );

      if (failedResult) {
        // Handle rejected promise or failed result with proper error message.
        let errorMessage = 'An error occurred while saving reviews.';
        if (failedResult.status === 'rejected') {
          errorMessage = failedResult.reason instanceof Error ? failedResult.reason.message : 'A server action failed.';
        } else if (failedResult.status === 'fulfilled' && failedResult.value?.error) {
          errorMessage = typeof failedResult.value.error === 'string' ? failedResult.value.error : 'A server action failed.';
        }
        throw new Error(errorMessage);
      }

      // If we reach here, all promises resolved successfully.
      console.log("All reviews saved successfully!");
      
      // Trigger a refresh of the main table in the parent component.
      onReviewComplete();
      
      // Close the modal.
      onClose();

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving.';
      console.error("Error saving reviews:", err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (label: string, value: any) => ( <div className="py-2"><dt className="text-sm font-medium text-gray-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-blue-800">{displayValue(value)}</dd></div> );
  const renderBioDataSection = (title: string, icon: JSX.Element, fields: { label: string; value: any }[]) => ( <div className="mb-6 bg-white shadow sm:rounded-lg p-4"><h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-3">{icon} <span className="ml-2">{title}</span></h3><dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">{fields.map(field => renderField(field.label, field.value))}</dl></div> );

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-gray-100 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 flex justify-between items-center">
                    Review Applicant Submission
                    <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}><FaTimes size={20} /></button>
                  </Dialog.Title>
                  <div className="mt-4 max-h-[75vh] overflow-y-auto pr-2">
                    {isLoading && (
                      <div className="flex justify-center items-center py-10">
                        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
                        <p className="ml-3">Loading details...</p>
                      </div>
                    )}
                    {error && !isLoading && (
                      <div className="my-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold"><FaExclamationTriangle className="inline mr-2" />Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <button onClick={() => { fetchApplicationDetails(); }} className="ml-4 px-2 py-1 text-xs bg-red-200 text-red-800 border border-red-400 rounded hover:bg-red-300">
                          Retry
                        </button>
                      </div>
                    )}
                    {!isLoading && applicationDetails && (
                      <>
                        <div className="mb-8 p-4 bg-white shadow sm:rounded-lg">
                          <h3 className="text-xl leading-6 font-semibold text-gray-900 flex items-center mb-4"><FaFileAlt className="mr-2 text-blue-600" /> Submitted Documents</h3>
                          {applicationDetails.application_documents_row && (
                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <p className="text-sm font-semibold">Document Set Status: <span className={`ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${applicationDetails.application_documents_row.status === 'approved' ? 'bg-green-100 text-green-800' : applicationDetails.application_documents_row.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{formatDocumentTypeName(applicationDetails.application_documents_row.status)}</span></p>
                              {applicationDetails.application_documents_row.admin_comment && ( <p className="text-sm text-gray-600 mt-1"><FaComments className="inline mr-1.5 text-gray-500"/>Admin Comment: {applicationDetails.application_documents_row.admin_comment}</p> )}
                              <p className="text-xs text-gray-500 mt-1">Reviewed At: {formatDate(applicationDetails.application_documents_row.reviewed_at, true)}</p>
                            </div>
                          )}
                          {applicationDetails.applicant_documents.length > 0 ? ( <div className="space-y-4">{applicationDetails.applicant_documents.map((doc) => { const isImage = doc.public_url && doc.original_filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i); return ( <div key={doc.id} className="p-3 border rounded-md hover:shadow-md transition-shadow"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between"><div className="flex-1 mb-2 sm:mb-0"><h4 className="text-lg font-semibold text-blue-700">{formatDocumentTypeName(doc.document_type)}</h4><p className="text-xs text-gray-500">Filename: {doc.original_filename} ({doc.file_size ? (doc.file_size / 1024).toFixed(2) : 'N/A'} KB)</p><p className="text-xs text-gray-500">Uploaded: {formatDate(doc.uploaded_at, true)}</p></div><div className="flex items-center space-x-2 flex-shrink-0">{doc.public_url && isImage ? ( <button type="button" onClick={() => { handleOpenImagePreview(doc.public_url || ''); }} className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center" title="Preview Image"><FaImage className="mr-1.5" /> Preview</button> ) : doc.public_url ? ( <a href={doc.public_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center" title="View document in new tab"><FaExternalLinkAlt className="mr-1.5" /> View</a> ) : ( <span className="text-xs text-red-500">(No File Available)</span> )}</div></div></div> ); })}</div> ) : ( <p className="text-gray-600">No documents submitted for this application.</p> )}
                        </div>

                        {renderBioDataSection("Personal Information", <FaUser className="text-blue-600" />, [
                          { label: "Surname", value: applicationDetails.surname }, { label: "First Name", value: applicationDetails.first_name }, { label: "Middle Name", value: applicationDetails.middle_name }, { label: "Gender", value: applicationDetails.gender }, { label: "Date of Birth", value: formatDate(applicationDetails.date_of_birth) }, { label: "Marital Status", value: applicationDetails.marital_status }, { label: "State of Origin", value: applicationDetails.state_of_origin }, { label: "LGA", value: applicationDetails.lga }, { label: "Religion", value: applicationDetails.religion }, { label: "Address", value: applicationDetails.address }, { label: "Phone Number", value: applicationDetails.phone_number }, { label: "Email", value: applicationDetails.email }, { label: "Disability", value: applicationDetails.disability }, { label: "Health Challenge", value: applicationDetails.health_challenge },
                        ])}
                        {renderBioDataSection("Guardian Information", <FaUsers className="text-blue-600" />, [
                          { label: "Guardian Name", value: applicationDetails.guardian_name }, { label: "Guardian Address", value: applicationDetails.guardian_address }, { label: "Guardian Occupation", value: applicationDetails.guardian_occupation }, { label: "Guardian Relationship", value: applicationDetails.guardian_relationship }, { label: "Guardian Phone", value: applicationDetails.guardian_phone_number },
                        ])}
                        {renderBioDataSection("Education Information", <FaGraduationCap className="text-blue-600" />, [
                          { label: "School Name", value: applicationDetails.school_name }, { label: "Year of Entry", value: applicationDetails.year_of_entry }, { label: "Year of Graduation", value: applicationDetails.year_of_graduation }, { label: "Qualification Obtained", value: applicationDetails.qualification_obtained },
                        ])}

                        <div className="mb-6 bg-white shadow sm:rounded-lg p-4">
                          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-3"><FaBookOpen className="text-blue-600" /> <span className="ml-2">Program Selection (Editable)</span></h3>
                          <div className="p-4 border rounded-md mb-4 bg-gray-50">
                            <p className="font-semibold text-gray-700 mb-2">First Choice</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="modalFirstChoiceFacultyId" className="block text-sm font-medium text-gray-700">Faculty</label>
                                <select id="modalFirstChoiceFacultyId" value={firstChoiceFacultyId} onChange={e => setFirstChoiceFacultyId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                    <option value="">Select Faculty</option>
                                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor="modalFirstChoiceCourseId" className="block text-sm font-medium text-gray-700">Course</label>
                                <select id="modalFirstChoiceCourseId" value={firstChoiceCourseId} onChange={e => setFirstChoiceCourseId(e.target.value)} disabled={!firstChoiceFacultyId} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                                    <option value="">Select Course</option>
                                    {firstChoiceCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-md bg-gray-50">
                            <p className="font-semibold text-gray-700 mb-2">Second Choice</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="modalSecondChoiceFacultyId" className="block text-sm font-medium text-gray-700">Faculty</label>
                                <select id="modalSecondChoiceFacultyId" value={secondChoiceFacultyId} onChange={e => setSecondChoiceFacultyId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                    <option value="">Select Faculty</option>
                                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor="modalSecondChoiceCourseId" className="block text-sm font-medium text-gray-700">Course</label>
                                <select id="modalSecondChoiceCourseId" value={secondChoiceCourseId} onChange={e => setSecondChoiceCourseId(e.target.value)} disabled={!secondChoiceFacultyId} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                                    <option value="">Select Course</option>
                                    {secondChoiceCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pl-4">{renderField("JAMB Reg. Number", applicationDetails.jamb_registration_number)}</div>
                        </div>

                        <div className="mt-6 p-4 bg-white shadow sm:rounded-lg">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Admin Review & Actions</h3>
                          <div className="p-4 border border-blue-200 rounded-lg mb-6">
                            <h4 className="text-lg font-medium text-gray-800 mb-2">1. Document Set Review</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="documentSetStatus" className="block text-sm font-medium text-gray-700 mb-1">Document Set Status</label>
                                <select id="documentSetStatus" value={documentSetStatus} onChange={(e) => { setDocumentSetStatus(e.target.value); }} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2">
                                  <option value="pending_review">Pending Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="requires_changes">Requires Changes</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor="documentSetComment" className="block text-sm font-medium text-gray-700 mb-1">Document Set Comment (Visible to user)</label>
                                <textarea id="documentSetComment" rows={2} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2" value={documentSetComment} onChange={(e) => { setDocumentSetComment(e.target.value); }} placeholder="e.g., 'Your passport photo is blurry. Please re-upload.'" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border border-green-200 rounded-lg">
                            <h4 className="text-lg font-medium text-gray-800 mb-2">2. Overall Application Review</h4>
                            <div className="mb-4">
                              <label htmlFor="overallReviewNotes" className="block text-sm font-medium text-gray-700 mb-1">Overall Review Notes (Admin Only)</label>
                              <textarea id="overallReviewNotes" rows={3} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2" value={overallReviewNotes} onChange={(e) => { setOverallReviewNotes(e.target.value); }} placeholder="Internal notes about the application." />
                            </div>
                            <div>
                              <label htmlFor="overallAppStatus" className="block text-sm font-medium text-gray-700 mb-1">Change Overall Application Status</label>
                              <select id="overallAppStatus" value={overallAppStatus} onChange={(e) => { setOverallAppStatus(e.target.value); }} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2">
                                <option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under Review</option><option value="AWAITING_DOCUMENTS">Awaiting Documents</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ADMITTED">Admitted</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end mt-6">
                            <button type="button" onClick={() => { handleSaveAllReviews(); }} disabled={isSubmitting} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400">
                              {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                              Save All Reviews & Update Status
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    {!isLoading && !error && !applicationDetails && (
                      <div className="text-center py-10">
                        <p className="text-gray-600">No application details found for the provided ID.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 focus:outline-none" onClick={onClose}>
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <ImagePreviewModal isOpen={isImagePreviewOpen} onClose={handleCloseImagePreview} imageUrl={previewImageUrl} />
    </>
  );
}