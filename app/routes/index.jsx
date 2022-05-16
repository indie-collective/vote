import fs from "fs";
import path from "path";
import { useEffect } from "react";
import {
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
} from "@chakra-ui/react";
import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

import { db } from "../utils/db.server";

const REFRESH_TIME = 3;

export async function loader() {
  // load categories
  const file = fs.readFileSync(path.join(__dirname, "../games.json"), "utf8");
  const categories = JSON.parse(file);

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
  const { games } = useLoaderData();

  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, REFRESH_TIME * 1000);

    return () => clearInterval(interval);
  });

  return (
    <Container as="main" mt="30px">
      <Heading>Results</Heading>

      <Alert status="info" m="15px">
        <AlertIcon />
        Results updated every {REFRESH_TIME} seconds.
        <ChakraLink as={Link} color="teal.500" to="/host">
          Visit hosting page.
        </ChakraLink>
      </Alert>

      <TableContainer mt="15px" mb="30px">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Game</Th>
              <Th>Category</Th>
              <Th isNumeric>Votes</Th>
            </Tr>
          </Thead>

          <Tbody>
            {games.map((game) => (
              <Tr key={game.title}>
                <Td
                  maxWidth="340px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {game.title}
                </Td>
                <Td>{game.category}</Td>
                <Td isNumeric>{game.votes}</Td>
              </Tr>
            ))}
          </Tbody>

          <Tfoot>
            <Tr>
              <Th>Game</Th>
              <Th>Category</Th>
              <Th isNumeric>Votes</Th>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>
    </Container>
  );
}
