import {
  getIronSession,
  type IronSession,
} from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions } from "./sessionOptions";

export type AdminSessionData = {
  admin?: {
    username: string;
  };
};

export async function getAdminSession(): Promise<
  IronSession<AdminSessionData>
> {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, getSessionOptions());
}

export async function requireAdminSession(): Promise<IronSession<AdminSessionData> | null> {
  const session = await getAdminSession();
  if (!session.admin?.username) {
    return null;
  }
  return session;
}
