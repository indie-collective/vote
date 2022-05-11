import { useState } from "react";
import {
  Container,
  Heading,
  RadioGroup,
  Stack,
  Radio,
  Box,
  Button,
} from "@chakra-ui/react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
const fs = require("fs");
const path = require("path");

export function loader(context) {
  const { params } = context.request;

  const file = fs.readFileSync(path.join(__dirname, "../games.json"), "utf8");
  const categories = JSON.parse(file);

  console.log(params);

  return json(categories);
}

export default function Vote() {
  const categories = useLoaderData();

  const [value, setValue] = useState();

  return (
    <div>
      <Container as="main">
        <Heading>Votez pour votre jeu préféré!</Heading>
        <Box p="5">
          <RadioGroup onChange={setValue} value={value}>
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
          <Button variantColor="blue" mt={4} onClick={() => alert(value)}>
            Vote
          </Button>
        </Box>
      </Container>
    </div>
  );
}
