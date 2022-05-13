import fs from "fs";
import path from "path";

import { useState } from "react";
import {
  Container,
  Heading,
  RadioGroup,
  Stack,
  Radio,
  Box,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useLoaderData, Form } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";

import { checkCode } from "~/utils/qrcode.server";
import { stunvote } from "~/cookies";
import { db } from "~/utils/db.server";

export async function loader({ params, request }) {
  const cookieHeader = request.headers.get("Cookie");

  // Load games
  const file = fs.readFileSync(path.join(__dirname, "../games.json"), "utf8");
  const categories = JSON.parse(file);

  // Check if the code is valid
  const { badToken, expiredToken } = checkCode(params.token);

  // Check if already voted
  const cookie = (await stunvote.parse(cookieHeader)) || {};
  const alreadyVoted = cookie.voted || false;

  return json({ categories, badToken, expiredToken, alreadyVoted });
}

export async function action(request) {
  const cookieHeader = request.headers.get("Cookie");
  const formData = await request.formData();

  // TODO: Check token
  // TODO: Check if already voted
  // TODO: Store vote

  // Set cookie to voted
  const cookie = await stunvote.parse(cookieHeader);
  cookie.voted = true;

  return redirect("/", {
    headers: {
      "Set-Cookie": await stunvote.serialize(cookie),
    },
  });
}

export default function Vote() {
  const { categories, badToken, expiredToken, alreadyVoted } = useLoaderData();

  if (badToken) {
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

  if (expiredToken) {
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

  if (alreadyVoted) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Déjà voté!</AlertTitle>
        <AlertDescription>Un vote par personne siouplé.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <Container as="main" mt="30px">
        <Heading mb="15px">Votez pour votre jeu préféré!</Heading>
        <Box p="5">
          <Form reloadDocument method="post">
            <RadioGroup>
              {categories.map((category) => (
                <Box key={category.name} mb={5}>
                  <Heading as="h2" size="md" mb={3}>
                    {category.displayName}
                  </Heading>
                  <Stack spacing={3}>
                    {category.games.map((game) => (
                      <Radio key={game.title} value={game.title}>
                        {game.title} by {game.studio}
                      </Radio>
                    ))}
                  </Stack>
                </Box>
              ))}
            </RadioGroup>
            <Button type="submit" variantColor="blue" mt={4}>
              Vote
            </Button>
          </Form>
        </Box>
      </Container>
    </div>
  );
}
