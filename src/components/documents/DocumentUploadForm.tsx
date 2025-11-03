"use client";

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { FaFilePdf, FaFileImage, FaCheckCircle, FaSpinner, FaEye, FaUpload, FaCheck } from 'react-icons/fa';
import { documentFields, DocumentField } from '@/lib/config/documentFields';
import { upsertDocuments, getDocumentUrl, DocumentState } from '@/app/(dashboard)/documents/actions';

type ApplicationDocumentRecord = Record<string, unknown> | null;

interface Props {
  initialData: ApplicationDocumentRecord;
  isEditMode: boolean;
}

const initialState: DocumentState = {
  success: false,
  message: null,
  errors: null,
};

function SubmitButton({ isEditMode }: { isEditMode: boolean }): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex justify-center items-center w-full px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
          Uploading...
        </>
      ) : (
        <>
          <FaUpload className="-ml-1 mr-3 h-5 w-5" />
          {isEditMode ? 'Update Documents' : 'Upload Documents'}
        </>
      )}
    </button>
  );
}

export default function DocumentUploadForm({
  initialData,
  isEditMode,
}: Props): React.JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(upsertDocuments, initialState);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formResetTriggered, setFormResetTriggered] = useState(false);

  // Default accepted formats for documents
  const defaultAcceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png'];
  const defaultAcceptString = '.pdf,.jpg,.jpeg,.png';

  // Memoized function to check for unsaved changes
  const checkUnsavedChanges = useCallback(() => {
    const hasFiles = Object.keys(selectedFiles).length > 0;
    if (hasFiles !== hasUnsavedChanges) {
      setHasUnsavedChanges(hasFiles);
    }
  }, [selectedFiles, hasUnsavedChanges]);

  // Warning for unsaved changes
  useEffect(() => {
    checkUnsavedChanges();
  }, [checkUnsavedChanges]);

  // Handle successful form submission
  useEffect(() => {
    if (state.success && !formResetTriggered) {
      setFormResetTriggered(true);
      if (formRef.current) {
        formRef.current.reset();
      }
      setSelectedFiles({});
      setHasUnsavedChanges(false);
    } else if (!state.success && formResetTriggered) {
      setFormResetTriggered(false);
    }
  }, [state.success, formResetTriggered]);

  // Prevent page navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved file selections. Are you sure you want to leave?';
        return 'You have unsaved file selections. Are you sure you want to leave?';
      }
    };

    // Browser navigation (refresh, back button, close tab)
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const getFileIcon = (filename: string): React.JSX.Element => {
    if (filename.toLowerCase().endsWith('.pdf')) {
      return <FaFilePdf className="text-red-600 mr-2 w-5 h-5" />;
    }
    return <FaFileImage className="text-blue-600 mr-2 w-5 h-5" />;
  };

  const handleFileChange = (fieldId: string, event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [fieldId]: file }));
    } else {
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fieldId];
        return newFiles;
      });
    }
  };

  const handleViewDocument = async (field: DocumentField): Promise<void> => {
    const filePath = initialData?.[`${field.id}_file_path`] as string | undefined;
    if (!filePath) return;

    setViewingDocument(field.id);

    try {
      const result = await getDocumentUrl(filePath);
      if (result.url) {
        window.open(result.url, '_blank');
      } else {
        alert('Unable to view document: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Error viewing document. Please try again.');
    } finally {
      setViewingDocument(null);
    }
  };

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 p-4 rounded" role="alert">
          <div className="flex items-center">
            <span className="text-amber-600 mr-2">⚠️</span>
            <div>
              <p className="font-semibold">Don't Forget to Save</p>
              <p className="text-sm">You have added files that haven't been uploaded yet. Don't forget to click "Upload Documents" to save your changes.</p>
            </div>
          </div>
        </div>
      )}

      {state.success && (
        <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-4 rounded" role="alert">
          <div className="flex items-center">
            <FaCheckCircle className="mr-2 text-green-600" />
            <div>
              <p className="font-bold">Success!</p>
              <p>{state.message}</p>
            </div>
          </div>
        </div>
      )}

      {!state.success && state.message && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{state.message}</p>
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-6">
        <div className="space-y-6">
          {documentFields.map((field: DocumentField) => {
            const fileName = initialData?.[`${field.id}_original_filename`] as string | undefined;
            const uploadedAt = initialData?.[`${field.id}_uploaded_at`] as string | undefined;
            const hasExistingFile = fileName && uploadedAt;
            const hasNewFile = selectedFiles[field.id];
            const fieldError = state.errors?.[field.id]?.[0];
            const hasNoFile = !hasExistingFile && !hasNewFile;

            // Use field.acceptedFormats if it exists, otherwise use defaults
            const acceptedFormats = (field as any).acceptedFormats || defaultAcceptedFormats;
            const acceptString = (field as any).acceptedFormats?.join(',') || defaultAcceptString;

            // Create unique IDs for each field
            const inputId = `file-input-${field.id}`;
            const labelId = `file-label-${field.id}`;

            return (
              <div 
                key={field.id} 
                className={`border-2 rounded-lg p-5 transition-all duration-200 ${
                  hasExistingFile || hasNewFile
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor={inputId} className="block text-sm font-semibold text-gray-800">
                      {hasNoFile && (
                        <span className="text-red-600 font-medium mr-2">
                          No file has been added yet -
                        </span>
                      )}
                      {field.label}
                      {field.required && <span className="text-red-600 ml-1">*</span>}
                    </label>
                    {(hasExistingFile || hasNewFile) && (
                      <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        <FaCheck className="w-3 h-3 mr-1" />
                        File Ready
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Accepted formats: {acceptedFormats.join(', ')} | Max size: 5MB
                  </p>
                </div>

                {hasExistingFile && (
                  <div className="mb-4 p-4 bg-white border-2 border-green-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getFileIcon(fileName)}
                        <div>
                          <p className="text-sm font-bold text-gray-900 mb-1">{fileName}</p>
                          <p className="text-xs text-gray-600 font-medium">
                            📅 Uploaded: {new Date(uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { void handleViewDocument(field); }}
                        disabled={viewingDocument === field.id}
                        className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                      >
                        {viewingDocument === field.id ? (
                          <>
                            <FaSpinner className="animate-spin mr-2 w-4 h-4" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FaEye className="mr-2 w-4 h-4" />
                            View File
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Replace with new file:</span>
                      <label 
                        htmlFor={inputId}
                        id={labelId}
                        className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors"
                      >
                        <FaUpload className="mr-2 w-4 h-4" />
                        Choose New File
                      </label>
                    </div>
                  </div>
                )}

                {hasNewFile && (
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getFileIcon(hasNewFile.name)}
                        <div>
                          <p className="text-sm font-bold text-blue-900 mb-1">📄 {hasNewFile.name}</p>
                          <p className="text-xs text-blue-700 font-medium">
                            💾 Size: {(hasNewFile.size / 1024 / 1024).toFixed(2)} MB | Ready to upload
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Change selection:</span>
                      <label 
                        htmlFor={inputId}
                        id={labelId}
                        className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors"
                      >
                        <FaUpload className="mr-2 w-4 h-4" />
                        Choose Different File
                      </label>
                    </div>
                  </div>
                )}

                {!hasExistingFile && !hasNewFile && (
                  <div className="mb-4">
                    <label 
                      htmlFor={inputId}
                      id={labelId}
                      className="inline-flex items-center px-6 py-3 border border-blue-600 shadow-sm text-base font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors"
                    >
                      <FaUpload className="mr-2 w-5 h-5" />
                      Choose File
                    </label>
                  </div>
                )}

                <input
                  id={inputId}
                  name={field.id}
                  type="file"
                  accept={acceptString}
                  onChange={(e) => handleFileChange(field.id, e)}
                  className="hidden"
                />
                
                {fieldError && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-red-700 text-sm font-medium">❌ {fieldError}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t-2 border-gray-200">
          <SubmitButton isEditMode={isEditMode} />
        </div>
      </form>
    </div>
  );
}