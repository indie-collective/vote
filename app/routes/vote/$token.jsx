import fs from "fs";
import path from "path";
import { useState, useEffect } from "react";
import {
  Container,
  Heading,
  Stack,
  Box,
  Button,
  useRadioGroup,
  Grid,
  Image,
  CircularProgress,
  CircularProgressLabel,
  Flex,
} from "@chakra-ui/react";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { json } from "@remix-run/node";
import shuffle from "lodash.shuffle";

import { checkCode } from "~/utils/qrcode.server";
import { stunvote } from "~/cookies";
import { db } from "~/utils/db.server";
import CustomRadio from "~/components/CustomRadio";
import Logo from "~/components/Logo";
import AlertPage from "~/components/AlertPage";

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

  return json(
    {
      success: true,
    },
    {
      headers: {
        "Set-Cookie": await stunvote.serialize(cookie),
      },
    }
  );
}

const CountdownProgress = ({ to }) => {
  const [, update] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (new Date() > to) {
        window.location.reload();
      }

      update((state) => state + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [to]);

  const timeLeft = Math.floor((to - +new Date()) / 1000);

  return (
    <CircularProgress value={(timeLeft / (2 * 60)) * 100} color="green.400">
      <CircularProgressLabel color="white">
        {timeLeft > 60 ? Math.ceil(timeLeft / 60) + "m" : timeLeft}
      </CircularProgressLabel>
    </CircularProgress>
  );
};

export default function Vote() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [selected, setSelected] = useState(false);

  const error = loaderData.error || actionData?.error;

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "game",
    onChange: () => setSelected(true),
  });

  const group = getRootProps();

  if (loaderData.alreadyVoted || actionData?.success) {
    return (
      <AlertPage
        title="Merci pour votre vote ! 🎉"
        description="Bon Stunfest !"
        status="success"
      />
    );
  }

  if (error === "invalid") {
    return (
      <AlertPage
        title="Lien de vote invalide !"
        description="Essayez de scanner le QR Code à nouveau."
      />
    );
  }

  if (error === "expired") {
    return (
      <AlertPage
        title="Lien de vote expiré !"
        description="Essayez de scanner le QR Code à nouveau."
      />
    );
  }

  const { games, expiresIn } = loaderData;

  return (
    <Box bg="black">
      <Container as="main" pt="30px">
        <Logo />

        <Heading
          fontFamily="extenda"
          fontWeight="normal"
          textTransform="uppercase"
          fontSize="40px"
          textAlign="center"
          color="white"
        >
          Votez pour votre jeu préféré !
        </Heading>
        <Form reloadDocument method="post">
          <Stack spacing={3} {...group} pb="100px">
            {games.map((game) => {
              const radio = getRadioProps({ value: game.title });
              return (
                <CustomRadio key={game.title} {...radio}>
                  <Grid
                    gridTemplateColumns="auto 1fr"
                    alignItems="center"
                    columnGap={5}
                    fontFamily="extenda"
                    color="white"
                  >
                    <Image
                      gridRow="1 / 3"
                      width="80px"
                      height="80px"
                      objectFit="cover"
                      src={`/2022/${game.title
                        .toLowerCase()
                        .replace(/[^a-zA-Z0-9]|-|\s/gim, "")}.jpg`}
                    />
                    <Box
                      gridColumn={2}
                      fontSize="28px"
                      fontWeight="normal"
                      textTransform="uppercase"
                    >
                      {game.title}
                    </Box>
                    <Box
                      gridColumn={2}
                      fontSize="18px"
                      textTransform="uppercase"
                    >
                      {game.studio}
                    </Box>
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
            bg="black"
            boxShadow="0 -4px 6px -1px rgba(255, 255, 255, 0.1),0 -2px 4px -1px rgba(255, 255, 255, 0.06)"
            alignItems="center"
          >
            <CountdownProgress to={expiresIn} />
            <Button
              type="submit"
              colorScheme="green"
              mt={4}
              isFullWidth
              fontFamily="extenda"
              textTransform="uppercase"
              fontSize="30px"
              m={0}
              ml="10px"
              disabled={!selected}
            >
              Vote
            </Button>
          </Flex>
        </Form>
      </Container>
    </Box>
  );
}
