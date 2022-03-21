import Head from "next/head";
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

export default function Vote() {
  const [value, setValue] = useState("1");

  return (
    <div>
      <Head>
        <title>IndieCo - Vote</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container as="main">
        <Heading>Vote</Heading>
        <Box p="5">
          <RadioGroup onChange={setValue} value={value}>
            <Stack direction="row">
              <Radio value="1">Game 1</Radio>
              <Radio value="2">Game 2</Radio>
              <Radio value="3">Game 3</Radio>
            </Stack>
          </RadioGroup>
          <Button variantColor="blue" mt={4} onClick={() => alert(value)}>
            Vote
          </Button>
        </Box>
      </Container>
    </div>
  );
}
