import { useApiKeyStore } from '@/stores/assistant/apiKeyStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ApiKeyValidator({ children }: { children: React.ReactNode }) {
  const { storedApiKey } = useApiKeyStore();
  const router = useRouter();
  
  if (!storedApiKey) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">API Key Required</h2>
          <p className="mb-4">Please set up your API key to use this feature.</p>
          <Button onClick={() => router.push('/settings')}>
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}