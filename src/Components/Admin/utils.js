/**
 * Load Google Font into the document
 */
export function loadGoogleFont(family) {
  const id = `gf-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap`;
  document.head.appendChild(link);
}
