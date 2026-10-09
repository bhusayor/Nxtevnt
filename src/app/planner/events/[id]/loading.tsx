export default function EventLoading() {
  return <div className="w-full animate-pulse space-y-6" aria-label="Loading event workspace">
    <div className="h-5 w-24 rounded bg-[#e8ece9]" />
    <div className="h-56 rounded-[1.25rem] bg-[#dfe9e1]" />
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <div className="h-72 rounded-xl bg-white" />
      <div className="space-y-4"><div className="h-10 w-52 rounded-lg bg-[#e8ece9]" /><div className="grid gap-3 sm:grid-cols-3"><div className="h-28 rounded-xl bg-white" /><div className="h-28 rounded-xl bg-white" /><div className="h-28 rounded-xl bg-white" /></div></div>
    </div>
  </div>;
}
