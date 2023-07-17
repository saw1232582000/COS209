import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInSchema } from "./schema/user.schema";
//import DiscordProvider from "next-auth/providers/discord";
//import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { verify } from "argon2";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

const credentialsProvider = CredentialsProvider({
  // The name to display on the sign in form (e.g. "Sign in with...")
  name: "Credentials",
  async authorize(credentials, req) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const creds = await signInSchema.parseAsync(credentials);
      const allusertype = await prisma.user.findMany({
        where: { phone: credentials?.phone },
      });
      const user = await prisma.user.findFirst({
        where: { phone: credentials?.phone },
      });
      console.log(credentials?.password);
      console.log(allusertype);
      if (!user) {
        return null;
      }

      const isValid = await verify(user.password, creds.password);
      if (!isValid) {
        return null;
      }

      return user;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  credentials: {
    phone: { label: "phone", type: "phone", placeholder: "09234234" },
    password: { label: "Password", type: "password" },
  },
});

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  providers: [
    credentialsProvider,

    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      user && (token.user = user);
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session:  ({ session, token }: any) => {
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      session.user = token.user;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return session;
    },
    // redirect: async ({ url, baseUrl, ...rest }) => {
    //   console.log(`url=${url}| baseUrl=${baseUrl}`);
    //   console.log(rest);
    //   const u = url.replace(/^[a-zA-Z]{3,5}\:\/{2}[a-zA-Z0-9_.:-]+\//, "");
    //   return `${baseUrl}/${u}`;
    // },
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
