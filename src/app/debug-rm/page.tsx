// src/app/debug-rm/page.tsx
import GrantRMAccess from "@/components/debug/GrantRMAccess";

export default function DebugRMPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">RM Access Debug</h1>
        <GrantRMAccess />
      </div>
    </div>
  );
}
