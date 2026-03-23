import SearchScreen from "@/screens/SearchPage";
import { spaceCatalog } from "@/lib/data/spaceCatalog";

interface SearchPageProps {
  searchParams?: { category?: string | string[] };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const spaces = await spaceCatalog.listSpaces();
  const categoryParam = searchParams?.category;
  const initialCategory = Array.isArray(categoryParam)
    ? categoryParam[0]
    : categoryParam;

  return <SearchScreen spaces={spaces} initialCategory={initialCategory} />;
}
