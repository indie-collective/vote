import { useEffect } from "react";
import {
  Container,
  Box,
  Heading,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Link as ChakraLink,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
const fs = require("fs");
const path = require("path");

const REFRESH_TIME = 3;

export function loader() {
  const file = fs.readFileSync(path.join(__dirname, "../games.json"), "utf8");
  const categories = JSON.parse(file);
  return json(categories);
}

export default function Results() {
  const categories = useLoaderData();

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

      {categories.map((category) => (
        <Box key={category.name} mt={10}>
          <Heading as="h2" size="md">
            {category.displayName}
          </Heading>

          <StatGroup key={category.name} mt={3}>
            {category.games.map((game) => (
              <Stat key={game.title} m="15px">
                <StatLabel>{game.title}</StatLabel>
                <StatNumber>345,670</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  23.36%
                </StatHelpText>
              </Stat>
            ))}
          </StatGroup>
        </Box>
      ))}
    </Container>
  );
}
