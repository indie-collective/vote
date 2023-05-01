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
        bg="#e8db22"
        borderRadius="md"
        color="black"
        _checked={{
          bg: "#fff",
          color: "#46bee7",
        }}
        _focus={{
          boxShadow: "0 0 0 3px #e8db22",
        }}
        px={5}
        py={3}
      >
        {props.children}
      </Box>
    </Box>
  );
}
