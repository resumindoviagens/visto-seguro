import { buildICS } from "./brevoEmail";

function addHours(value, hours = 2) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function b64(value) {
  return Buffer.from(value, "utf-8").toString("base64");
}

function makeAttachment({ name, title, description, location, start, end }) {
  const ics = buildICS({ title, description, location, start, end: end || addHours(start, 2) });
  return { name, content: b64(ics) };
}

export function travelAgendaAttachments(trip) {
  const attachments = [];

  if (trip.outbound_date) {
    attachments.push(makeAttachment({
      name: "viagem-ida.ics",
      title: `Viagem — ida — ${trip.title}`,
      description: `Voo de ida da viagem ${trip.title}. Localizador: ${trip.booking_locator || "-"}. Confira sempre eventuais alterações com a companhia aérea.`,
      location: trip.destination || "",
      start: trip.outbound_date
    }));
  }

  if (trip.has_return && trip.return_date) {
    attachments.push(makeAttachment({
      name: "viagem-volta.ics",
      title: `Viagem — volta/outro trecho — ${trip.title}`,
      description: `Voo de volta/outro trecho da viagem ${trip.title}. Localizador: ${trip.return_booking_locator || trip.booking_locator || "-"}. Confira sempre eventuais alterações com a companhia aérea.`,
      location: trip.destination || "",
      start: trip.return_date
    }));
  }

  if (trip.hotel_checkin) {
    attachments.push(makeAttachment({
      name: "hotel-checkin.ics",
      title: `Check-in hotel — ${trip.hotel_name || trip.title}`,
      description: `Check-in do hotel da viagem ${trip.title}. Confirmação: ${trip.hotel_confirmation || "-"}.`,
      location: trip.hotel_address || trip.hotel_name || "",
      start: `${trip.hotel_checkin}T15:00:00-03:00`
    }));
  }

  if (trip.car_pickup) {
    attachments.push(makeAttachment({
      name: "carro-retirada.ics",
      title: `Retirada do carro — ${trip.car_company || trip.title}`,
      description: `Retirada do carro da viagem ${trip.title}. Confirmação: ${trip.car_confirmation || "-"}.`,
      location: trip.car_company || "",
      start: trip.car_pickup
    }));
  }

  return attachments;
}
