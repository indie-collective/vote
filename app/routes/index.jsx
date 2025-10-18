import fs from "fs";
import path from "path";
import { useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  Image,
  Text,
} from "@chakra-ui/react";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";

import { db } from "../utils/db.server";

const REFRESH_TIME = 3;

export async function loader() {
  // load categories
  const file = fs.readFileSync(
    path.join(__dirname, "../games-2025.json"),
    "utf8"
  );
  const categories = JSON.parse(file).filter(
    (category) => category.name === "competition"
  );

  // load votes
  const topVotes = await db.vote.groupBy({
    by: ["game"],
    _count: {
      game: true,
    },
    orderBy: {
      _count: {
        game: "desc",
      },
    },
  });

  // turns votes into a map
  const votes = topVotes.reduce((acc, vote) => {
    acc[vote.game] = vote._count.game;
    return acc;
  }, {});

  // merge votes and games
  const games = categories
    .reduce(
      (games, category) =>
        games.concat(
          category.games.map((game) => ({
            ...game,
            category: category.displayName,
            votes: votes[game.title] || 0,
          }))
        ),
      []
    )
    .sort((a, b) => b.votes - a.votes);

  return json({ games });
}

export default function Results() {
  const data = useLoaderData();
  const fetcher = useFetcher();

  const { games } = fetcher.data ? fetcher.data : data;

  useEffect(() => {
    const interval = setInterval(() => {
      fetcher.load("/");
    }, REFRESH_TIME * 1000);

    return () => clearInterval(interval);
  }, [fetcher]);

  return (
    <Box bg="linear-gradient(180deg, #543926, #ffb7d7, #ed7129);" fontFamily="Jersey10">
      <Container as="main" pt="30px" maxW="90ch" color="white">
        <Heading
          mb="30px"
          fontFamily="Jersey10"
          background="white"
          fontWeight="normal"
          fontSize="80px"
          bgClip="text"
        >
          Résultats
        </Heading>

        <TableContainer mt="15px" pb="50px" color="white">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Game</Th>
                <Th isNumeric>Votes</Th>
              </Tr>
            </Thead>

            <Tbody>
              {games.map((game, index) => (
                <Tr key={game.title}>
                  <Td
                    maxWidth="340px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    color="white"
                    fontWeight="normal"
                    fontSize={index === 0 ? "60px" : "40px"}
                    position="relative"
                  >
                    <Image
                      src={`/2025/${game.title
                        .toLowerCase()
                        .replace(/[^a-zA-Z0-9]|-|\s/gim, "")}.jpg`}
                      alt={game.title}
                      width={index === 0 ? "120px" : "80px"}
                      height={index === 0 ? "120px" : "80px"}
                    />
                    {index === 0 && (
                      <Text
                        as="span"
                        position="absolute"
                        left={0}
                        top="5px"
                        lineHeight={1}
                      >
                        🌟
                      </Text>
                    )}
                    <Text as="span" bgClip="text" color="white">
                      {game.title}
                    </Text>
                  </Td>
                  <Td fontSize="40px" isNumeric>
                    {game.votes}
                  </Td>
                </Tr>
              ))}
            </Tbody>

            <Tfoot>
              <Tr>
                <Th>Game</Th>
                <Th isNumeric>Votes</Th>
              </Tr>
            </Tfoot>
          </Table>
        </TableContainer>

        <Box mt="10px" pb="30px">
          <Alert status="info">
            <AlertIcon />
            Results updated every {REFRESH_TIME} seconds.
            <ChakraLink as={Link} color="teal.500" to="/host">
              Visit hosting page.
            </ChakraLink>
          </Alert>
        </Box>
      </Container>
    </Box>
  );
}
