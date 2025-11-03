'use client';

import { useFormState } from 'react-dom';
import { useTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MoreHorizontal, CheckCircle, XCircle, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// --- IMPORT FOR MODAL (Restored) ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { 
  updateAdmissionStatus, 
  UpdateStatusState, 
  deleteAdmission, 
  DeleteState
} from '@/app/(dashboard)/admin/admissions/actions';

import { ADMISSION_STATUSES, AdmissionStatusType, PATHS } from '@/lib/constants';

interface AdminAdmissionActionsProps {
  admissionId: string;
  admissionRef: string;
  currentStatus: AdmissionStatusType;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

const initialUpdateState: UpdateStatusState = { success: false, message: '' };
const initialDeleteState: DeleteState = { success: false, message: '' };

export default function AdminAdmissionActions({
  admissionId,
  admissionRef,
  currentStatus,
  onDeleted,
  onUpdated,
}: AdminAdmissionActionsProps) {
  const [confirmState, confirmAction] = useFormState(updateAdmissionStatus, initialUpdateState);
  const [rejectState, rejectAction] = useFormState(updateAdmissionStatus, initialUpdateState);
  const [deleteState, deleteAction] = useFormState(deleteAdmission, initialDeleteState);
  const [isPending, startTransition] = useTransition();
  
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // --- STATE FOR LETTER MODAL (Restored) ---
  const [showLetterModal, setShowLetterModal] = useState(false);

  // The useEffect hooks remain the same for handling server action responses
  useEffect(() => {
    if (confirmState.message) {
      if (confirmState.success) toast.success(`Admission ${admissionRef} Confirmed`);
      else toast.error('Confirmation Failed', { description: confirmState.message });
      setShowConfirmDialog(false);
      onUpdated?.();
    }
  }, [confirmState, admissionRef, onUpdated]);

  useEffect(() => {
    if (rejectState.message) {
      if (rejectState.success) toast.success(`Admission ${admissionRef} Rejected`);
      else toast.error('Rejection Failed', { description: rejectState.message });
      setShowRejectDialog(false);
      onUpdated?.();
    }
  }, [rejectState, admissionRef, onUpdated]);

  useEffect(() => {
    if (deleteState.message) {
      if (deleteState.success) toast.success(`Admission ${admissionRef} Deleted`);
      else toast.error('Deletion Failed', { description: deleteState.message });
      setShowDeleteDialog(false);
      onDeleted?.();
    }
  }, [deleteState, admissionRef, onDeleted]);


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`${PATHS.ADMIN_ADMISSIONS}/${admissionId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowConfirmDialog(true)}
            disabled={isPending || currentStatus === ADMISSION_STATUSES.CONFIRMED}
            className="text-green-600 focus:text-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Confirm Admission</span>
          </DropdownMenuItem>

          {/* --- VIEW LETTER ITEM (Restored to trigger Modal) --- */}
          {currentStatus === ADMISSION_STATUSES.CONFIRMED && (
            <DropdownMenuItem onClick={() => setShowLetterModal(true)}>
              <Eye className="mr-2 h-4 w-4" />
              <span>View Admission Letter</span>
            </DropdownMenuItem>
          )}

          {/* --- REJECT ITEM (Added) --- */}
          <DropdownMenuItem
            onClick={() => setShowRejectDialog(true)}
            disabled={isPending || currentStatus === ADMISSION_STATUSES.REJECTED}
            className="text-orange-600 focus:text-orange-700"
          >
            <XCircle className="mr-2 h-4 w-4" />
            <span>Reject Admission</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {/* --- DELETE ITEM (Added) --- */}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
            className="text-red-600 focus:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- CONFIRM DIALOG (Unchanged) --- */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <form action={(formData) => startTransition(() => confirmAction(formData))}>
            <input type="hidden" name="admissionId" value={admissionId} />
            <input type="hidden" name="status" value={ADMISSION_STATUSES.CONFIRMED} />
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Admission?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the status of admission{' '}
                <span className="font-semibold">{admissionRef}</span> to 'Confirmed'.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
                {isPending ? 'Confirming...' : 'Yes, confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* --- REJECT DIALOG (Added) --- */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <form action={(formData) => startTransition(() => rejectAction(formData))}>
            <input type="hidden" name="admissionId" value={admissionId} />
            <input type="hidden" name="status" value={ADMISSION_STATUSES.REJECTED} />
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Admission?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the status of admission{' '}
                <span className="font-semibold">{admissionRef}</span> to 'Rejected'.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
                {isPending ? 'Rejecting...' : 'Yes, reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- DELETE DIALOG (Fixed) --- */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <form action={(formData) => startTransition(() => deleteAction(formData))}>
            <input type="hidden" name="admissionId" value={admissionId} />
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the admission record for{' '}
                <span className="font-semibold">{admissionRef}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                type="submit" 
                disabled={isPending} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? 'Deleting...' : 'Yes, delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- LETTER PREVIEW MODAL (Restored) --- */}
      <Dialog open={showLetterModal} onOpenChange={setShowLetterModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Admission Letter Preview</DialogTitle>
            <DialogDescription>
              Viewing letter for Ref: {admissionRef}. You can print from this preview (Ctrl+P or Cmd+P).
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow border rounded-md overflow-hidden">
            <iframe
              src={`/letter/${admissionId}`}
              title="Admission Letter Preview"
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}