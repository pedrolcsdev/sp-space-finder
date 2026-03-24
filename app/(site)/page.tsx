import HomeScreen from "@/screens/Index";
import { spaceCatalog } from "@/lib/data/spaceCatalog";

export default async function HomePage() {
  const spaces = await spaceCatalog.listSpaces();

  return <HomeScreen spaces={spaces} />;
}
