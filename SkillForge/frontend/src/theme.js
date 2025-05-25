import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: true,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.800" : "gray.50",
      },
    }),
  },
  colors: {
    brand: {
      50: "#e3f2ff",
      100: "#b3daff",
      200: "#81c2ff",
      300: "#4faaff",
      400: "#1d92ff",
      500: "#006ecc",
      600: "#005399",
      700: "#003866",
      800: "#001c33",
      900: "#000000",
    },
  },
  components: {
    Button: {
      baseStyle: {
        rounded: "lg",
        _focus: { boxShadow: "outline" },
      },
      variants: {
        solid: (props) => ({
          bg: props.colorMode === "dark" ? "brand.300" : "brand.500",
          color: "white",
          _hover: { bg: props.colorMode === "dark" ? "brand.200" : "brand.600" },
        }),
      },
    },
  },
});

export default theme;