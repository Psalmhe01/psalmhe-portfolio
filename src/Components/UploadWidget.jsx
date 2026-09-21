import { useRef, useState } from "react";
import { Button, Group, Text } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { addGalleryPhotos } from "../galleryStore";
import { auth } from "../firebase";
import { isAdminUser } from "../adminAccess";

export default function UploadWidget({ gallerySlug }) {
  const input = useRef(null);
  const pending = useRef([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(false);
  const savePending = async () => {
    while (pending.current.length) {
      const photos = pending.current.slice(0, 25);
      await addGalleryPhotos(gallerySlug, photos);
      pending.current.splice(0, photos.length);
    }
    setRetry(false);
  };
  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || busy) return;
    if (!isAdminUser(auth.currentUser)) { setStatus("Photographer access required."); return; }
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) { setStatus("Cloudinary upload settings are missing."); return; }
    if (files.length > 100 || files.some((file) => file.size > 30000000 || !/\.(jpe?g|png|webp|heic)$/i.test(file.name))) {
      setStatus("Choose up to 100 JPG, PNG, WebP or HEIC images, each under 30 MB.");
      return;
    }
    setBusy(true);
    let completed = 0;
    try {
      for (const file of files) {
        setStatus(`Uploading photo ${completed + 1} of ${files.length}...`);
        const body = new FormData();
        body.append("file", file);
        body.append("upload_preset", preset);
        body.append("folder", "client-galleries/" + gallerySlug);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: "POST", body });
        if (!response.ok) throw new Error("Photo upload failed. Please retry the remaining photos.");
        const result = await response.json();
        if (!result.public_id || !result.secure_url?.startsWith("https://res.cloudinary.com/")) throw new Error("Invalid photo response.");
        const displayUrl = result.format === "heic" ? result.secure_url.replace("/upload/", "/upload/f_jpg/") : result.secure_url;
        pending.current.push({ publicId: result.public_id, url: displayUrl,
          thumbnailUrl: displayUrl.replace("/upload/", "/upload/c_limit,w_600,q_auto/"),
          filename: result.format === "heic" ? file.name.replace(/\.heic$/i, ".jpg") : file.name,
          width: result.width || 0, height: result.height || 0 });
        // Persist each completed upload so a later network failure loses no earlier work.
        await savePending();
        completed++;
      }
      setStatus(`${completed} photo(s) added.`);
    } catch (err) {
      setStatus(`${completed} photo(s) saved. ${err.message}`);
      setRetry(pending.current.length > 0);
    } finally { setBusy(false); }
  };
  const retrySave = async () => {
    setBusy(true);
    try { await savePending(); setStatus("Uploaded photos saved."); }
    catch { setStatus("Unable to save uploaded photos. Please retry."); }
    finally { setBusy(false); }
  };
  return <Group gap="sm" py="md">
    <input ref={input} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.heic" hidden onChange={handleFiles} />
    <Button leftSection={<IconUpload size={15} />} onClick={() => input.current.click()} loading={busy} disabled={retry}>Upload Photos</Button>
    {retry && <Button onClick={retrySave} loading={busy}>Save Uploaded Photos</Button>}
    {status && <Text size="sm" role="status">{status}</Text>}
  </Group>;
}
