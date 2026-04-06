import LoginScreen from "@/screens/Login";

interface LoginPageProps {
  searchParams?: { redirect?: string | string[] };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectParam = Array.isArray(searchParams?.redirect)
    ? searchParams?.redirect[0]
    : searchParams?.redirect;

  return <LoginScreen redirectTo={redirectParam} />;
}
