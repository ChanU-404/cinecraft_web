import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        // @ts-ignore
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        // Mock Provider for Local Development
        ...(process.env.NODE_ENV === 'development' ? [
            CredentialsProvider({
                id: 'credentials',
                name: 'Mock Login',
                credentials: {},
                authorize: async () => {
                    return {
                        id: 'dev-user',
                        name: 'Dev Director',
                        email: 'director@cinecraft.dev',
                        image: null
                    };
                }
            })
        ] : []),

    ],
    pages: {
        // signIn: '/auth/signin', // We can add a custom page later
    },
    theme: {
        colorScheme: "dark",
        brandColor: "#ff365c",
        logo: "https://cinecraft.ai/logo.png", // Placeholder
    },
    secret: process.env.NEXTAUTH_SECRET || "complex_secret_string_for_dev_only",
};
