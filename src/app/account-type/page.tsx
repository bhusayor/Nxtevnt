import type { Metadata } from "next";

import { AccountTypeSelection } from "@/components/auth/account-type-selection";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Choose account type",
  description: "Choose how you will use Nxtevnt.",
};

export default function AccountTypePage() {
  return (
    <AuthShell>
      <AccountTypeSelection />
    </AuthShell>
  );
}
