// src/components/common/PaymentVerificationLoading.tsx

export default function PaymentVerificationLoading() {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Verifying payment status...</p>
      </div>
    );
  }