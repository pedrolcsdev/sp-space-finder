import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import ReserveSpaceScreen from "@/screens/ReserveSpace";
import {
  MOCK_AUTH_COOKIE,
  isMockAuthenticatedFromCookieValue,
} from "@/lib/auth/mockAuth";

interface ReserveSpacePageProps {
  params: { id: string };
}

export default async function ReserveSpacePage({ params }: ReserveSpacePageProps) {
  const space = await spaceCatalog.getSpaceById(params.id);

  if (!space) {
    notFound();
  }

  const cookieStore = cookies();
  const authCookie = cookieStore.get(MOCK_AUTH_COOKIE)?.value;
  const isLoggedIn = isMockAuthenticatedFromCookieValue(authCookie);

  if (!isLoggedIn) {
    redirect(`/login?redirect=${encodeURIComponent(`/reservar/${space.id}`)}`);
  }

  return <ReserveSpaceScreen space={space} />;
}
