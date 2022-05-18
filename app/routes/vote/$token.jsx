import fs from "fs";
import path from "path";
import {useState, useEffect} from 'react';
import {
  Container,
  Heading,
  Stack,
  Box,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useRadioGroup,
  Grid,
  Image,
  CircularProgress,
  CircularProgressLabel,
  Flex
} from "@chakra-ui/react";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";

import { checkCode } from "~/utils/qrcode.server";
import { stunvote } from "~/cookies";
import { db } from "~/utils/db.server";
import CustomRadio from "~/components/CustomRadio";
import shuffle from "lodash.shuffle";

export async function loader({ params, request }) {
  const cookieHeader = request.headers.get("Cookie");

  // Load games
  const file = fs.readFileSync(path.join(__dirname, "../games.json"), "utf8");
  const categories = JSON.parse(file);

  const games = shuffle(
    categories.find((category) => category.name === "indieawards").games
  );

  // Check if the code is valid
  const { error, expiresIn } = checkCode(params.token);

  // Check if already voted
  const cookie = (await stunvote.parse(cookieHeader)) || {};
  const alreadyVoted = cookie.voted || false;

  return json({ games, error, alreadyVoted, expiresIn });
}

export async function action({ request, params }) {
  const cookieHeader = request.headers.get("Cookie");
  const formData = await request.formData();

  const check = checkCode(params.token);

  if (check.error) {
    // refresh the page and display the error
    return json({ error: check.error });
  }

  // Check if already voted
  const cookie = (await stunvote.parse(cookieHeader)) || {};
  const alreadyVoted = cookie.voted || false;

  if (alreadyVoted) {
    // refresh the page and display the error
    return json({ error: "voted" });
  }

  // Store vote
  await db.vote.create({
    data: {
      game: formData.get("game"),
    },
  });

  // Set cookie to voted
  cookie.voted = true;

  return redirect("/", {
    headers: {
      "Set-Cookie": await stunvote.serialize(cookie),
    },
  });
}

const CountdownProgress = ({ to }) => {
  const [, update] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (new Date() > to) {
        window.location.reload();
      }

      update(state => state + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [to]);

  const timeLeft = Math.floor((to - (+new Date())) / 1000);

  return (
    <CircularProgress value={(timeLeft / (2 * 60)) * 100} color='green.400'>
      <CircularProgressLabel>{timeLeft > 60 ? Math.ceil(timeLeft / 60) + 'm' : timeLeft}</CircularProgressLabel>
    </CircularProgress>
  );
}

export default function Vote() {
  const loaderData = useLoaderData();
  const actionData = useActionData();

  const error = loaderData.error || actionData?.error;

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "game",
  });

  const group = getRootProps();

  if (error === "invalid") {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Lien de vote invalide</AlertTitle>
        <AlertDescription>
          Essayez de scanner un QR code valide ;)
        </AlertDescription>
      </Alert>
    );
  }

  if (error === "expired") {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Lien de vote expiré</AlertTitle>
        <AlertDescription>
          Essayez de scanner le QR Code à nouveau.
        </AlertDescription>
      </Alert>
    );
  }

  if (error === "voted") {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Déjà voté!</AlertTitle>
        <AlertDescription>Un vote par personne siouplé.</AlertDescription>
      </Alert>
    );
  }

  const { games, expiresIn } = loaderData;

  return (
    <div>
      <Container as="main" mt="30px">
        <Heading fontFamily="extenda" textTransform="uppercase" fontSize="60px" textAlign="center">Votez pour votre jeu préféré!</Heading>
        <Box p="5">
          <Form reloadDocument method="post">
            <Stack spacing={3} {...group} mb="80px">
              {games.map((game) => {
                const radio = getRadioProps({ value: game.title });
                return (
                  <CustomRadio key={game.title} {...radio}>
                    <Grid
                      gridTemplateColumns="auto 1fr"
                      alignItems="center"
                      columnGap={5}
                      fontFamily="extenda"
                    >
                      <Image gridRow="1 / 3" width="75px" height="75px" />
                      <Box gridColumn={2} fontSize="28px" textTransform="uppercase">{game.title}</Box>
                      <Box gridColumn={2} fontSize="18px" textTransform="uppercase">{game.studio}</Box>
                    </Grid>
                  </CustomRadio>
                );
              })}
            </Stack>
            <Flex
              position="fixed"
              bottom={0}
              left={0}
              right={0}
              margin="auto"
              padding="15px"
              bg="white"
              boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1),0 -2px 4px -1px rgba(0, 0, 0, 0.06)"
              alignItems="center"
            >
              <CountdownProgress to={expiresIn} />
              <Button type="submit" colorScheme="green" mt={4} isFullWidth fontFamily="extenda" textTransform="uppercase" fontSize="30px" m={0} ml="10px">
                Vote
              </Button>
            </Flex>
          </Form>
        </Box>
      </Container>
    </div>
  );
}
