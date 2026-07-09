'use server'

import { cookies } from "next/headers"

export default async function setLangVal(value:string) {
    const cookieStore = await cookies();
    cookieStore.set('languge', value);
}