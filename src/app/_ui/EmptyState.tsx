export function EmptyState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-8">
      <div className="text-sm font-semibold text-slate-900">还没有排练记录</div>
      <div className="mt-2 max-w-xl text-sm text-slate-600">
        创建第一场“公务员面试”会话。内容默认保存在本地，不会上传。
      </div>
    </div>
  );
}

