import "./globals.css";
import Nav from "@/components/Navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          <div>
            <Nav />
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
