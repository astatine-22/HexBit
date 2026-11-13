import "./globals.css";

export const metadata = {
  title: {
    default: "CodeMentor — practice on the shelf",
    template: "%s · CodeMentor",
  },
  description:
    "A vinyl-shelf way to practice code: browse curated challenges, read the pressing, and solve them with a mentor on standby. Mock data, local progress, no account needed.",
  applicationName: "CodeMentor",
  authors: [{ name: "CodeMentor" }],
  keywords: ["coding challenges", "practice", "Next.js", "CodeMentor"],
};

export const viewport = {
  themeColor: "#14150f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}