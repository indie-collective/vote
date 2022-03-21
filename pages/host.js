import Head from "next/head";
import { useState, useEffect } from "react";
import { Box, Heading, Image } from "@chakra-ui/react";

const REFRESH_RATE = 2000;

export default function Host() {
  const [code, setCode] = useState();

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/qrcode?host=${window.location.host}`)
        .then((res) => res.text())
        .then((code) => setCode(code));
    }, REFRESH_RATE);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Head>
        <title>IndieCo - Host</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Box align="center" justify="center" mt={10}>
          <Heading>Vote</Heading>
          <Image src={code} />
        </Box>
      </main>
    </div>
  );
}
