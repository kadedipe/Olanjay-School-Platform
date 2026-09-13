import Image from "next/image";
import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/password-reset-request-form";

export default function ForgotPasswordPage(){return <main className="authPage"><section className="authCard"><div className="brand authBrand"><Image className="brandLogo authLogo" src="/Olanjay_School_Logo.jpg" alt="Olanjay New Africa Technical School logo" width={1168} height={784} priority/><div><strong>Olanjay</strong><small>Technical School</small></div></div><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Reset your password</h1><p>Enter your school email. If the account is active, we will send a one-time link.</p><PasswordResetRequestForm/><p className="authLink"><Link href="/login">Back to sign in</Link></p></section></main>}
