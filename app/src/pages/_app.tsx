import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LazyMotion, domAnimation } from "framer-motion";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="bg-white min-h-screen max-w-screen overflow-hidden">
    <LazyMotion features={domAnimation}>
      <Component {...pageProps} />
      </LazyMotion>
    </div>
  );
}
