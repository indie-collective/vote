import fs from "fs";
import path from "path";

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
  const { error } = checkCode(params.token);

  // Check if already voted
  const cookie = (await stunvote.parse(cookieHeader)) || {};
  const alreadyVoted = cookie.voted || false;

  return json({ games, error, alreadyVoted });
}

export async function action({ request, params }) {
  const cookieHeader = request.headers.get("Cookie");
  const formData = await request.formData();

  console.log("has voted for", formData.get("game"));

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

  const { games } = loaderData;

  return (
    <div>
      <Container as="main" mt="30px">
        <Heading mb="15px">Votez pour votre jeu préféré!</Heading>
        <Box p="5">
          <Form reloadDocument method="post">
            <Stack spacing={3} {...group}>
              {games.map((game) => {
                const radio = getRadioProps({ value: game.title });
                return (
                  <CustomRadio key={game.title} {...radio}>
                    <Grid
                      gridTemplateColumns="auto 1fr"
                      alignItems="center"
                      columnGap={5}
                    >
                      <Image gridRow="1 / 3" width="75px" height="75px" />
                      <Box gridColumn={2}>{game.title}</Box>
                      <Box gridColumn={2}>{game.studio}</Box>
                    </Grid>
                  </CustomRadio>
                );
              })}
            </Stack>
            <Button type="submit" colorScheme="green" mt={4} isFullWidth>
              Vote
            </Button>
          </Form>
        </Box>
      </Container>
    </div>
  );
}
