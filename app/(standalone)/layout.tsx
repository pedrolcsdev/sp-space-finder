import { ThemeToggle } from "@/components/ThemeToggle";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ThemeToggle variant="floating" />
    </>
  );
}
