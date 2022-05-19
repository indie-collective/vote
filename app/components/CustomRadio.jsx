import { Box, useRadio } from "@chakra-ui/react";

export default function RadioCard(props) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        borderColor="gray.700"
        _checked={{
          bg: "green.500",
          color: "black",
          borderColor: "green.500",
        }}
        _focus={{
          boxShadow: "0 0 0 3px white",
        }}
        px={5}
        py={3}
      >
        {props.children}
      </Box>
    </Box>
  );
}
