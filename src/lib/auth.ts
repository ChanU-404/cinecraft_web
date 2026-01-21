import GoogleProvider from "next-auth/providers/google";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),

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
