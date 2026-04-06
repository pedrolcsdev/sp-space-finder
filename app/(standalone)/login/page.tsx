import LoginScreen from "@/screens/Login";

interface LoginPageProps {
  searchParams?: { redirect?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginScreen redirectTo={searchParams?.redirect} />;
}
