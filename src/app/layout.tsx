import "../styles/globals.css";
import { Inter, Dancing_Script } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import ContactModal from "@/components/ContactModal";

const inter = Inter({ subsets: ["latin"] });
const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-dancing",
});

export const metadata = {
  title: {
    default: "Ice.code | Full Stack Developer & Systems Architect",
    template: "%s | Ice.code"
  },
  description: "Caleb \"Ice\" Trahan, founder and engineer. I build and run Primal Hosted (game-server hosting for 35 communities), Taskiry, Isla Prima and the systems behind them.",
  keywords: [
    "full stack developer",
    "systems architect", 
    "Python developer",
    "JavaScript developer",
    "React developer",
    "Next.js",
    "Three.js",
    "web development",
    "portfolio",
    "Ice Trahan"
  ],
  authors: [{ name: "Ice Trahan", url: "https://github.com/icetrahan" }],
  creator: "Ice Trahan",
  metadataBase: new URL("https://icecode.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://icecode.dev",
    title: "Ice.code | Full Stack Developer & Systems Architect",
    description: "Professional portfolio showcasing full stack development expertise, 3D web applications, and innovative solutions.",
    siteName: "Ice.code Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ice.code | Full Stack Developer",
    description: "Professional portfolio showcasing full stack development expertise and innovative solutions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${dancing.variable}`}>
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen flex flex-col`}>
        <BackgroundFX />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <ContactModal />
      </body>
    </html>
  );
}