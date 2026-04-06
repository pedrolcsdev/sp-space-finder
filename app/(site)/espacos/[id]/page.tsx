import { notFound } from "next/navigation";
import SpaceDetailsScreen from "@/screens/SpaceDetails";
import { spaceCatalog } from "@/lib/data/spaceCatalog";

interface SpaceDetailsPageProps {
  params: { id: string };
}

export default async function SpaceDetailsPage({
  params,
}: SpaceDetailsPageProps) {
  const space = await spaceCatalog.getSpaceById(params.id);

  if (!space) {
    notFound();
  }

  return <SpaceDetailsScreen space={space} />;
}
