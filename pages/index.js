import Head from "next/head";
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
} from "@chakra-ui/react";

export default function Results() {
  return (
    <div>
      <Head>
        <title>IndieCo - Results</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container as="main">
        <Heading>Results</Heading>
        <StatGroup mt={10}>
          <Stat>
            <StatLabel>Game 1</StatLabel>
            <StatNumber>345,670</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              23.36%
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Game 2</StatLabel>
            <StatNumber>45</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              9.05%
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Game 3</StatLabel>
            <StatNumber>4,556</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              1.3%
            </StatHelpText>
          </Stat>
        </StatGroup>
      </Container>
    </div>
  );
}
