import { useEffect } from "react";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Box, Heading, Image, Link as ChakraLink, Text } from "@chakra-ui/react";

import { generateQRCode } from "../utils/qrcode.server";

const REFRESH_TIME = 3;

const isAuthorized = (request) => {
  const header = request.headers.get("Authorization");

  if (!header) return false;

  const base64 = header.replace("Basic ", "");
  const [username, password] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  return username === process.env.USERNAME && password === process.env.PASSWORD;
};

export const headers = () => ({
  "WWW-Authenticate": "Basic",
});

export async function loader({ request }) {
  const host = new URL(request.url).host;
  return json(await generateQRCode(host));
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
        <ChakraLink as={Link}
          color="teal.500"
          to={`/vote/${data.token}`}
        >
          vote link
        </ChakraLink>
        <Text fontSize="xs">Refreshes every {REFRESH_TIME} seconds.</Text>
      </Box>
    </main>
  );
}
