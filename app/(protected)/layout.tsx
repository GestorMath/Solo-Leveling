import ClientLayout from '../components/ClientLayout'

/**
 * Layout das rotas protegidas.
 * Todas as telas dentro de app/(protected)/ são envolvidas por este layout.
 * O SystemProvider vive aqui via ClientLayout — NÃO no root layout.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}