import "../app/globals.css";

/**
 * Pages Router shell. The app's real routes live in app/, but pages/login.js
 * needs global Tailwind styles of its own.
 */
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
