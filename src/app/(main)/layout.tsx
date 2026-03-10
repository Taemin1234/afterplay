import Header from '@/components/layout/Header'

export default function MainLayout({
  children, modal,
}: {
  children: React.ReactNode;
  modal : React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className='container mx-auto px-5 py-4 lg:py-8'>
        {children}
        {modal}
      </main>
      {/* <Footer /> */}
    </>
  );
}
