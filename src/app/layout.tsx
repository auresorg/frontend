import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans"; // import font
import "./globals.css";
import { DialogProvider } from "@/components/ui/dialog-service";
import { ThemeProvider } from "next-themes";
import Script from "next/script";

export const metadata: Metadata = {
    title: "Aures",
    description: "Your work, Your portfolio, One Identity.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // add font to className, also add antialiased and dark mode
        <html lang="en" className={`${GeistSans.className} antialiased dark:bg-neutral-900 hideScrollbar`}>
            <head>
                <Script
                    id="clarity-script"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                        (function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "usczjsjo78");
                        `,
                    }}
                />

            </head>
            <body style={{ margin: 0, padding: 0 }} className="overflow-hidden hideScrollbar">
                <ThemeProvider defaultTheme="light" disableTransitionOnChange attribute="class">
                    <DialogProvider>{children}</DialogProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}