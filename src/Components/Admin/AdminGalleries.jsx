import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  useAllGalleries,
  createGallery,
  deleteGallery,
} from "../../Hooks/useGallery.js";
import UploadWidget from "../UploadWidget.jsx";
import {
  AppShell,
  Group,
  Text,
  Button,
  Title,
  Modal,
  TextInput,
  PasswordInput,
  Stack,
  Paper,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
  Center,
  Code,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconTrash,
  IconLink,
  IconUpload,
  IconEye,
  IconPlus,
  IconCheck,
  IconPencil,
  IconArrowLeft,
} from "@tabler/icons-react";
import GalleryEditorDrawer from "./components/GalleryEditorDrawer";

export default function AdminGalleries() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { galleries, loading } = useAllGalleries();

  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [form, setForm] = useState({ name: "", clientEmail: "", password: "" });
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeUpload, setActiveUpload] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState("");
  const [editingGallery, setEditingGallery] = useState(null);

  useEffect(() => {
    if (user === null) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleCreate = async () => {
    setFormError("");
    if (!form.name || !form.password) {
      setFormError("Gallery name and password are required.");
      return;
    }
    setCreating(true);
    try {
      await createGallery(form);
      setForm({ name: "", clientEmail: "", password: "" });
      closeCreate();
      notifications.show({
        message: "Gallery created!",
        color: "green",
        icon: <IconCheck size={16} />,
      });
      window.location.reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/gallery/${slug}`);
    setCopiedSlug(slug);
    notifications.show({
      message: "Link copied!",
      color: "blue",
      icon: <IconCheck size={16} />,
    });
    setTimeout(() => setCopiedSlug(""), 2000);
  };

  const handleDelete = (slug, name) => {
    modals.openConfirmModal({
      title: "Delete Gallery",
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{name}</strong>? This cannot
          be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await deleteGallery(slug);
        notifications.show({ message: "Gallery deleted.", color: "red" });
        window.location.reload();
      },
    });
  };

  if (user === undefined) return null;

  return (
    <>
      {editingGallery && (
        <GalleryEditorDrawer
          gallery={editingGallery}
          onClose={() => setEditingGallery(null)}
          onSaved={() => {}}
        />
      )}

      <AppShell header={{ height: 56 }} padding="md" py={100} bg="gray.0">
        <AppShell.Header px="md">
          <Group h="100%" justify="space-between">
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => navigate("/admin")}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
              <Text fw={600} size="sm">
                Manage Galleries
              </Text>
            </Group>
            <Group gap="sm">
              <Text size="xs" c="dimmed">
                {user?.email}
              </Text>
              <Button variant="subtle" size="xs" color="gray" onClick={logout} radius={0}>
                Sign out
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Stack maw={860} mx="auto" gap="lg">
            <Group justify="space-between" align="center">
              <Title order={2} fw={600} size="h3">
                Client Galleries
              </Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openCreate}
                radius={0}
              >
                New Gallery
              </Button>
            </Group>

            {loading ? (
              <Center h={200}>
                <Loader size="sm" />
              </Center>
            ) : galleries.length === 0 ? (
              <Center h={200}>
                <Text c="dimmed" size="sm">
                  No galleries yet. Create one above.
                </Text>
              </Center>
            ) : (
              <Stack gap="sm">
                {galleries.map((g) => (
                  <Paper 
                    key={g.id} 
                    withBorder p="md" 
                    radius={0} 
                    bg="rgba(255, 255, 255, 0.9)"
                  >
                    <Group
                      justify="space-between"
                      align="flex-start"
                      wrap="nowrap"
                    >
                      <Stack gap={4}>
                        <Group gap="sm">
                          <Text fw={600}>{g.name}</Text>
                          <Badge size="sm" variant="light" color="gray">
                            {g.photos?.length || 0} photos
                          </Badge>
                        </Group>
                        {g.clientEmail && (
                          <Text size="xs" c="dimmed">
                            {g.clientEmail}
                          </Text>
                        )}
                        <Code color="gray" style={{ fontSize: 11 }}>
                          /gallery/{g.slug}
                        </Code>
                      </Stack>

                      <Group gap="xs" wrap="nowrap">
                        <Tooltip label="Edit Design">
                          <ActionIcon
                            variant="light"
                            color="violet"
                            onClick={() => setEditingGallery(g)}
                          >
                            <IconPencil size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Upload Photos">
                          <ActionIcon
                            variant={
                              activeUpload === g.slug ? "filled" : "light"
                            }
                            color="blue"
                            onClick={() =>
                              setActiveUpload(
                                activeUpload === g.slug ? null : g.slug,
                              )
                            }
                          >
                            <IconUpload size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="View Gallery">
                          <ActionIcon
                            variant="light"
                            color="gray"
                            component="a"
                            href={`/admin/gallery/${g.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip
                          label={
                            copiedSlug === g.slug
                              ? "Copied!"
                              : "Copy client link"
                          }
                        >
                          <ActionIcon
                            variant="light"
                            color={copiedSlug === g.slug ? "green" : "gray"}
                            onClick={() => handleCopyLink(g.slug)}
                          >
                            {copiedSlug === g.slug ? (
                              <IconCheck size={16} />
                            ) : (
                              <IconLink size={16} />
                            )}
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Delete gallery">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(g.slug, g.name)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    {activeUpload === g.slug && (
                      <>
                        <Divider my="sm" />
                        <UploadWidget gallerySlug={g.slug} />
                      </>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </AppShell.Main>
      </AppShell>

      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={<Text fw={600}>Create New Gallery</Text>}
        centered
        radius={0}
      >
        <Stack gap="sm">
          <TextInput
            label="Gallery Name"
            placeholder="e.g. Smith Wedding 2025"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextInput
            label="Client Email"
            description="Optional — for your reference"
            placeholder="client@email.com"
            type="email"
            value={form.clientEmail}
            onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
          />
          <PasswordInput
            label="Gallery Password"
            description="The client will use this to access their gallery"
            placeholder="Choose a password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {formError && (
            <Alert color="red" variant="light" p="xs">
              {formError}
            </Alert>
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeCreate}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating} radius={0}>
              Create Gallery
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
