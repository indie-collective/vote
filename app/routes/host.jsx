import { Box, Heading, Image } from "@chakra-ui/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

import qrcode, { EXPIRE_TIME } from "../utils/qrcode.server";

export async function loader({ request }) {
  const host = new URL(request.url).host;
  return json(await qrcode(host));
}

export default function Host() {
  const data = useLoaderData();

  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, EXPIRE_TIME);

    return () => clearInterval(interval);
  })

  return (
    <main>
      <Box align="center" justify="center" mt={10}>
        <Heading>Vote</Heading>
        <Image src={data.code} />
      </Box>
    </main>
  );
}
