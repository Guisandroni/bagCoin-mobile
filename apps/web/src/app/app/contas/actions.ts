"use server"

import { revalidateTag } from "next/cache"

export async function revalidateAccounts() {
  revalidateTag("accounts", "max")
}

export async function revalidateCreditCards() {
  revalidateTag("credit-cards", "max")
}
