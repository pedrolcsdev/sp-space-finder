import { notFound } from "next/navigation";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import ReserveSpaceScreen from "@/screens/ReserveSpace";

interface ReserveSpacePageProps {
  params: { id: string };
}

export default async function ReserveSpacePage({ params }: ReserveSpacePageProps) {
  const space = await spaceCatalog.getSpaceById(params.id);

  if (!space) {
    notFound();
  }

  return <ReserveSpaceScreen space={space} />;
}
