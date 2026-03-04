export default function UiDebugPage() {
  return (
    <div className="space-y-8 max-w-lg mx-auto mt-12">
      <div className="bg-red-500 text-white p-4 rounded-xl font-bold text-lg">
        Tailwind Red Box
      </div>
      <div style={{ background: "var(--surface)", color: "var(--ink)", padding: 24, borderRadius: 16, fontWeight: 'bold', fontSize: 18 }}>
        Theme Var Box
      </div>
    </div>
  );
}
