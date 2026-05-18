import "../Style/Body.css";
import { Box, Title, Text, Stack, AspectRatio } from "@mantine/core";

function ContactBox() {
  return (
    <Stack className="contact-box" gap="xl">
      <Box className="contact-info">
        <Title order={3} mb="sm">
          Get In Touch
        </Title>
        <Text size="lg">
          For inquiries, collaborations, or to explore my artistic world, feel
          free to reach out.
        </Text>
      </Box>
      <AspectRatio ratio={16 / 9} className="map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d55280.805800794486!2d-90.4790016!3d30.516838399999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x862722985b04e61d%3A0xd65f00282c35660!2sSoutheastern%20Louisiana%20University!5e1!3m2!1sen!2sus!4v1759300991891!5m2!1sen!2sus"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </AspectRatio>
    </Stack>
  );
}

export default ContactBox;
