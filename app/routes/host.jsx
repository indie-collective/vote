import { useEffect } from "react";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { ViewIcon } from "@chakra-ui/icons";
import {
  chakra,
  Heading,
  Link as ChakraLink,
  Text,
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
} from "@chakra-ui/react";
import { css } from "@emotion/react";

import isAuthorized from "../utils/auth.server";
import { generateQRCode } from "../utils/qrcode.server";

// require('dotenv').config();

const REFRESH_TIME = 3;
// const VOTE_HOST = process.env.VOTE_HOST;

export async function loader({ request }) {
  const host = "vote.indieco.xyz";

  if (await isAuthorized(request)) {
    return json(await generateQRCode(host));
  }

  return json({ authorized: false }, { status: 401 });
}

const svgStyle = css`
  svg {
    max-width: 75vh;
    margin: auto;
  }
`;

export default function Host() {
  const data = useLoaderData();
  const fetcher = useFetcher();

  const { code, token } = fetcher.data ? fetcher.data : data;

  useEffect(() => {
    const interval = setInterval(() => {
      fetcher.load("/host");
    }, REFRESH_TIME * 1000);

    return () => clearInterval(interval);
  }, [fetcher]);

  return (
    <Stack
      as="main"
      direction="column"
      alignItems="stretch"
      textAlign="center"
      bg="linear-gradient(180deg, #543926, #ffb7d7, #ed7129);"
      minH="100%"
      shouldWrapChildren
    >
      <Heading
        fontFamily="Jersey10"
        fontWeight="normal"
        textTransform="uppercase"
        fontSize="100px"
        bgClip="text"
        color="white"
        p={1}
      >
        Votez pour votre
      </Heading>
      {code ? (
        <chakra.div css={svgStyle} dangerouslySetInnerHTML={{ __html: code }} />
      ) : (
        <FormControl maxW="400px" my={20} mx="auto">
          <InputGroup>
            <Input
              type="password"
              name="token"
              placeholder="Enter token"
              onChange={(e) => {
                document.cookie = "token=" + e.target.value;
              }}
              bg="white"
            />
            <InputRightElement children={<ViewIcon color="green.500" />} />
          </InputGroup>
        </FormControl>
      )}
      <Heading
        fontFamily="Jersey10"
        fontWeight="normal"
        textTransform="uppercase"
        fontSize="100px"
        bgClip="text"
        color="white"
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
    </Stack>
  );
}
