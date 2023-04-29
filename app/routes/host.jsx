import { useEffect } from "react";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import {
  chakra,
  Box,
  Heading,
  Link as ChakraLink,
  Text,
} from "@chakra-ui/react";
import { css } from '@emotion/react'

import { generateQRCode } from "../utils/qrcode.server";

const REFRESH_TIME = 3;

const isAuthorized = (request) => {
  const header = request.headers.get("Authorization");

  if (!header) return false;

  const base64 = header.replace("Basic ", "");
  const [username, password] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  return username === process.env.NAME && password === process.env.PASSWORD;
};

export const headers = () => ({
  "WWW-Authenticate": "Basic",
});

export async function loader({ request }) {
  const host = new URL(request.url).host;

  if (!isAuthorized(request)) {
    return json({ authorized: false }, { status: 401 });
  }

  return json(await generateQRCode(host));
}

const svgStyle = css`
  svg {
    max-width: 75vh;
  }
`;

export default function Host() {
  const data = useLoaderData();
  const fetcher = useFetcher();

  const { code, token } = fetcher.data ? fetcher.data : data;

  useEffect(() => {
    const interval = setInterval(() => {
      // window.location.reload();
      fetcher.submit();
    }, REFRESH_TIME * 1000);

    return () => clearInterval(interval);
  });

  return (
    <main>
      <Box align="center" justify="center" bg="#46bee7">
        <Heading
          fontFamily="stunfest"
          fontWeight="normal"
          textTransform="uppercase"
          fontSize="100px"
          bg="-webkit-linear-gradient(top, #e8db22 0%,#e8db22 33%,#fff 33%, #fff 66%, #e8db22 66%,#e8db22 100%)"
          bgClip="text"
          p={1}
        >
          Votez pour votre
        </Heading>
        <Heading
          fontFamily="stunfest"
          fontWeight="normal"
          textTransform="uppercase"
          fontSize="100px"
          bg="-webkit-linear-gradient(top, #e8db22 0%,#e8db22 33%,#fff 33%, #fff 66%, #e8db22 66%,#e8db22 100%)"
          bgClip="text"
          p={1}
        >
          jeu préféré !
        </Heading>
        {process.env.NODE_ENV === "development" && (
          <>
            <ChakraLink as={Link} color="teal.500" to={`/vote/${token}`}>
              vote link
            </ChakraLink>
            <Text fontSize="xs">Refreshes every {REFRESH_TIME} seconds.</Text>
          </>
        )}
      </Box>
    </main>
  );
}
