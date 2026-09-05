import { AcceptInvitationForm } from "@/components/accept-invitation-form";

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <main className="authPage"><section className="authCard"><p className="eyebrow">ACCOUNT INVITATION</p><h1>Join Olanjay</h1><p>Create a secure password to activate your account.</p>{token ? <AcceptInvitationForm token={token}/> : <p className="formError">The invitation link is incomplete.</p>}</section></main>;
}
