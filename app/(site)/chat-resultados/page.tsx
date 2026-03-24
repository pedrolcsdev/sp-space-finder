import ChatResultsScreen from "@/screens/ChatResults";
import { spaceCatalog } from "@/lib/data/spaceCatalog";

export default async function ChatResultsPage() {
  const spaces = await spaceCatalog.listSpaces();

  return <ChatResultsScreen spaces={spaces} />;
}
