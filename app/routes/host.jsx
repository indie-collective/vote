import { useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Box, Heading, Image, Link, Text } from "@chakra-ui/react";

import qrcode from "../utils/qrcode.server";

const REFRESH_TIME = 3;

export async function loader({ request }) {
  const host = new URL(request.url).host;
  return json(await qrcode(host));
}

export default function Host() {
  const data = useLoaderData();

  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, REFRESH_TIME * 1000);

    return () => clearInterval(interval);
  });

  return (
    <main>
      <Box align="center" justify="center" mt={10}>
        <Heading>Votez pour votre jeu préféré!</Heading>
        <Image src={data.code} m="30px" />
        <Link
          color="teal.500"
          href={`http://localhost:3000/vote/${data.token}`}
        >
          vote link
        </Link>
        <Text fontSize="xs">Refreshes every {REFRESH_TIME} seconds.</Text>
      </Box>
    </main>
  );
}
