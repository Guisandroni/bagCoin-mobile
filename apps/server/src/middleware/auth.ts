import { auth } from "@bagcoin/auth";

export async function getAuthSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return { userId: session?.user?.id ?? "", session };
}
