import { Layout } from "@/components/Layout";
import { spaceCatalog } from "@/lib/data/spaceCatalog";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chatFlow = await spaceCatalog.listChatFlow();

  return <Layout chatFlow={chatFlow}>{children}</Layout>;
}
