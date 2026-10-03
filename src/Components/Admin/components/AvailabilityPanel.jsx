import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Alert, Badge, Button, Checkbox, Group, Loader, Paper, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { db } from "../../../firebase";
import { BOOKING_TIME_ZONE, bookingLocalTime } from "../../../bookingTime";
import { TIME_SLOTS } from "../../../bookingSchedule";
import { blockBookingSlots, unblockBookingSlot } from "../../../bookingAvailability";

export default function AvailabilityPanel() {
  const [now, setNow] = useState(() => new Date());
  const localNow = bookingLocalTime(now);
  const today = localNow.slice(0, 10);
  const maxDate = bookingLocalTime(new Date(now.getTime() + 365 * 86400000)).slice(0, 10);
  const [date, setDate] = useState(today);
  const [availability, setAvailability] = useState({ date: null, slots: {}, loading: true, error: null });
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [saving, setSaving] = useState(null);
  const [retry, setRetry] = useState(0);
  const savingRef = useRef(false);
  const loading = availability.date !== date || availability.loading;
  const slots = availability.date === date ? availability.slots : {};
  const error = availability.date === date ? availability.error : null;
  const availableTimes = useMemo(() => TIME_SLOTS.filter((time) =>
    availability.date === date && !availability.loading && !availability.error &&
    !availability.slots[time] && date + " " + time > localNow,
  ), [availability, date, localNow]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setAvailability({ date, slots: {}, loading: true, error: null });
    if (!date) {
      setAvailability({ date, slots: {}, loading: false, error: "Choose a date to manage availability." });
      return;
    }
    return onSnapshot(query(collection(db, "availability"), where("date", "==", date)), (snapshot) => {
      const nextSlots = Object.fromEntries(snapshot.docs.map((entry) => [entry.id.split(" ")[1], entry.data()]));
      setAvailability({ date, slots: nextSlots, loading: false, error: null });
    }, () => {
      setAvailability({ date, slots: {}, loading: false, error: "Couldn’t load availability. Please try again." });
    });
  }, [date, retry]);

  useEffect(() => {
    setSelectedTimes((previous) => {
      const remaining = previous.filter((time) => availableTimes.includes(time));
      return remaining.length === previous.length ? previous : remaining;
    });
  }, [availableTimes]);

  const blockSelected = async () => {
    if (savingRef.current || loading || error || !selectedTimes.length) return;
    savingRef.current = true;
    setSaving("block");
    try {
      const count = await blockBookingSlots(db, date, selectedTimes);
      setSelectedTimes([]);
      notifications.show({ message: count ? `Blocked ${count} ${count === 1 ? "time slot" : "time slots"} on ${date}.` : "These times are already blocked.", color: "green" });
    } catch (err) {
      notifications.show({ title: "Unable to block times", message: err.code === "permission-denied" ? "Your session could not save availability. Refresh and try again." : err.message, color: "red" });
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
  };

  const unblock = async (time) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(time);
    try {
      await unblockBookingSlot(db, date, time);
      notifications.show({ message: `${date} at ${time} is available again.`, color: "green" });
    } catch (err) {
      notifications.show({ title: "Unable to unblock time", message: err.message, color: "red" });
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
  };

  return (
    <Paper component="section" withBorder radius={0} p={{ base: "md", sm: "xl" }} aria-labelledby="availability-title">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} id="availability-title">Manage availability</Title>
            <Text size="sm" c="dimmed">Block times you’re unavailable before clients book. Unblock a time to make it available again.</Text>
            <Text size="xs" c="dimmed" mt={4}>All times are in {BOOKING_TIME_ZONE}.</Text>
          </div>
          <TextInput type="date" label="Date" value={date} min={today} max={maxDate} disabled={Boolean(saving)} onChange={(event) => { setSelectedTimes([]); setDate(event.currentTarget.value); }} maw={240} />
        </Group>
        {error ? (
          <Alert color="red" title="Availability unavailable">
            <Text size="sm">{error}</Text>
            <Button mt="sm" variant="outline" size="xs" onClick={() => setRetry((value) => value + 1)}>Try again</Button>
          </Alert>
        ) : loading ? <Group><Loader size="sm" /><Text size="sm" role="status">Loading availability…</Text></Group> : (
          <>
            <Group gap="xs">
              <Button variant="subtle" size="xs" disabled={Boolean(saving) || !availableTimes.length} onClick={() => setSelectedTimes(availableTimes)}>Select all available times</Button>
              <Button variant="subtle" size="xs" disabled={Boolean(saving) || !selectedTimes.length} onClick={() => setSelectedTimes([])}>Clear selection</Button>
              <Text size="xs" c="dimmed" role="status">{selectedTimes.length} selected</Text>
            </Group>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
              {TIME_SLOTS.map((time) => {
                const slot = slots[time];
                const past = date + " " + time <= localNow;
                const blocked = slot?.blocked === true;
                const booked = Boolean(slot && !blocked);
                return (
                  <Paper key={time} withBorder radius={0} p="sm" style={{ borderColor: selectedTimes.includes(time) ? "var(--mantine-color-blue-5)" : undefined }}>
                    <Stack gap="xs">
                      <Text fw={600}>{time}</Text>
                      <Badge variant="light" color={booked ? "blue" : blocked ? "orange" : past ? "gray" : "green"}>{booked ? "Booked" : blocked ? "Blocked" : past ? "Past" : "Available"}</Badge>
                      {blocked ? (
                        <Button variant="outline" color="orange" size="xs" loading={saving === time} disabled={Boolean(saving) || past} onClick={() => unblock(time)} aria-label={`Unblock ${date} at ${time}`}>Unblock</Button>
                      ) : (
                        <Checkbox label="Block time" aria-label={`Block ${date} at ${time}`} checked={selectedTimes.includes(time)} disabled={booked || past || Boolean(saving)} onChange={(event) => {
                          const checked = event.currentTarget.checked;
                          setSelectedTimes((previous) => checked ? [...previous, time] : previous.filter((value) => value !== time));
                        }} />
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Booked sessions stay reserved and can’t be blocked.</Text>
              <Button radius={0} onClick={blockSelected} loading={saving === "block"} disabled={Boolean(saving) || !selectedTimes.length}>Block selected ({selectedTimes.length})</Button>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}
