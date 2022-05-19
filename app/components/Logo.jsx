import { Image } from "@chakra-ui/react";

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Indie Stunfest"
      width="100%"
      maxWidth="100%"
      objectFit="contain"
      mb={5}
    />
  );
}
