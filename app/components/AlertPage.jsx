import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Container,
} from "@chakra-ui/react";

import Logo from "./Logo";

const AlertPage = ({ title, description, status = "error" }) => (
  <Box bg="#46bee7" minH="100%" fontFamily="stunfest">
    <Container as="main" pt="30px">
      <Logo />

      <Alert
        status={status}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        p="30px"
        variant="solid"
      >
        <AlertIcon boxSize="70px" mr={0} mb={5} />
        <AlertTitle
          mt={4}
          mb={5}
          fontSize="38px"
          textTransform="uppercase"
          lineHeight={1}
          fontWeight="normal"
        >
          {title}
        </AlertTitle>
        <AlertDescription
          maxWidth="sm"
          fontSize="20px"
          lineHeight={1}
          fontWeight="normal"
        >
          {description}
        </AlertDescription>
      </Alert>
    </Container>
  </Box>
);

export default AlertPage;
