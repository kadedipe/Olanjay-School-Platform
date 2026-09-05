import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ accepted?: string }> }) {
  if ((await auth())?.user) redirect("/dashboard");
  const accepted = (await searchParams).accepted === "1";
  return <main className="authPage"><section className="authCard"><div className="brand authBrand"><span className="brandMark">OT</span><div><strong>Olanjay</strong><small>Technical School</small></div></div><p className="eyebrow">SECURE SCHOOL PLATFORM</p><h1>Welcome back</h1><p>Sign in with your school account.</p>{accepted && <p className="successNotice">Your account is ready. You can now sign in.</p>}<LoginForm /></section></main>;
}
