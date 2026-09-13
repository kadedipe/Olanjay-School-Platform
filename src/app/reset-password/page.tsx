import Image from "next/image";
import Link from "next/link";
import { PasswordResetForm } from "@/components/password-reset-form";

export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}){const token=(await searchParams).token??"";return <main className="authPage"><section className="authCard"><div className="brand authBrand"><Image className="brandLogo authLogo" src="/Olanjay_School_Logo.jpg" alt="Olanjay New Africa Technical School logo" width={1168} height={784} priority/><div><strong>Olanjay</strong><small>Technical School</small></div></div><p className="eyebrow">SECURE PASSWORD RESET</p><h1>Choose a new password</h1><p>This action signs out every existing session on the account.</p>{token?<PasswordResetForm token={token}/>:<p className="formError" role="alert">This reset link is incomplete.</p>}<p className="authLink"><Link href="/forgot-password">Request a new link</Link></p></section></main>}
