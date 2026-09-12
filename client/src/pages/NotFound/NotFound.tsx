import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
        <SearchX className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold">页面不存在</h1>
        <p className="mt-2 text-sm text-muted-foreground">该地址可能已变更，返回工作台继续使用。</p>
        <Button asChild className="mt-6">
          <Link to="/"><ArrowLeft className="size-4" />返回工作台</Link>
        </Button>
      </section>
    </main>
  );
}
