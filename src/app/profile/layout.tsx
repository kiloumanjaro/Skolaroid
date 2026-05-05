export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="scrollbar-hide h-full overflow-y-auto bg-[#fcfaf8]">
      {children}
    </main>
  );
}
