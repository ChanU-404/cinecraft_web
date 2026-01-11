import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        // Demo Login for immediate testing
        CredentialsProvider({
            name: "Demo Account",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "demo" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                // Any login works for demo purposes
                if (credentials?.username === "demo" && credentials?.password === "demo") {
                    return { id: "1", name: "Demo Director", email: "director@cinecraft.ai" };
                }
                return null; // Login failed
            }
        })
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
});

export { handler as GET, handler as POST };
