import FavoritesScreen from "@/screens/Favorites";
import { spaceCatalog } from "@/lib/data/spaceCatalog";

export default async function FavoritesPage() {
  const spaces = await spaceCatalog.listSpaces();

  return <FavoritesScreen spaces={spaces} />;
}
