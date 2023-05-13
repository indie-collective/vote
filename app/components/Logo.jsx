import { Flex, Image } from "@chakra-ui/react";

export default function Logo() {
  return (
    <Flex justifyContent="center">
      <Image
        src="/logo-2023.png"
        alt="Indie Stunfest"
        maxWidth="75%"
        objectFit="contain"
        mb={5}
      />
    </Flex>
  );
}
