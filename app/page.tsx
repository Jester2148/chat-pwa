import MobileLayout from "@/components/MobileLayout";
import PasswordGate from "@/components/PasswordGate";

export default function Home() {
  return (
    <div className="h-dvh w-full sm:max-w-3xl sm:mx-auto">
      <PasswordGate>
        <MobileLayout />
      </PasswordGate>
    </div>
  );
}
