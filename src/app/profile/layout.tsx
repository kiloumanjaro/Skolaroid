import { Header } from '@/components/header';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center pt-20">
        <div className="flex w-full flex-1 flex-col items-center">
          <div className="flex w-full max-w-6xl flex-1 flex-col px-5 pb-10 pt-6 md:px-6">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
