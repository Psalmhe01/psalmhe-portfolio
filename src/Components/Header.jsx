import "../Style/Header.css";
import "../App.css";
import { logoAbt } from "../Files/HomeImage.jsx";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Group,
  Box,
  Title,
  Burger,
  Drawer,
  Stack,
  Anchor,
  Image,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

function Header() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();

  return (
    <Box
      component="header"
      className="header"
      py="md"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-2)", minHeight: "80px", alignContent: "center" }}
      
    >
      <Container>
        <Group justify="space-between" wrap="nowrap">
          <Group align="center" gap="xs">
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                gap: "10px",
              }}
            >
            <Stack gap="xs">
              <Image
                src={logoAbt[0]}
                alt="Psalmhe Logo"
                w={200}
                h="auto"
                fit="contain"
              />
              <Title
                order={1}
                size="h4"
                style={{ letterSpacing: "3px", textTransform: "uppercase" }}
              >
                PHOTOGRAPHY
              </Title>
              </Stack>
            </Link>
          </Group>

          <Group gap="lg" visibleFrom="sm" component="nav">
            <Anchor component={Link} to="/" fw={500} underline="never" className="nav-links">
              Home
            </Anchor>
            <Anchor
              onClick={() => navigate("/")}
              href="#about"
              fw={500}
              underline="never"
              className="nav-links"
            >
              About
            </Anchor>
            <Anchor
              onClick={() => {
                navigate("/portfolio");
                window.scrollTo(0, 0);
              }}
              fw={500}
              underline="never"
              className="nav-links"
            >
              Gallery
            </Anchor>
            <Anchor
              onClick={() => navigate("/")}
              href="#contact"
              fw={500}
              underline="never"
              className="nav-links"
            >
              Contact
            </Anchor>
            {/***<Anchor
              onClick={() => {
                navigate("/book");
                window.scrollTo(0, 0);
              }}
              fw={500}
              underline="never"
              className="nav-links"
            >
              Book
            </Anchor>***/}
          </Group>

          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        </Group>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        size="100%"
        padding="md"
        title="Menu"
        hiddenFrom="sm"
      >
        <Stack gap="md">
          <Anchor component={Link} to="/" onClick={close} c="dark" size="lg">
            Home
          </Anchor>
          <Anchor
            onClick={() => {
              navigate("/");
              close();
            }}
            href="#about"
            c="dark"
            size="lg"
          >
            About
          </Anchor>
          <Anchor
            onClick={() => {
              navigate("/portfolio");
              window.scrollTo(0, 0);
              close();
            }}
            c="dark"
            size="lg"
          >
            Gallery
          </Anchor>
          <Anchor
            onClick={() => {
              navigate("/");
              close();
            }}
            href="#contact"
            c="dark"
            size="lg"
          >
            Contact
          </Anchor>
          <Anchor
            onClick={() => {
              navigate("/book");
              window.scrollTo(0, 0);
              close();
            }}
            c="dark"
            size="lg"
          >
            Book
          </Anchor>
        </Stack>
      </Drawer>
    </Box>
  );
}

export default Header;
