import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/auth";
import { defaultHelpTexts, sections } from "../../../../lib/formSchema";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data } = await supabaseAdmin
    .from("form_help_texts")
    .select("field_id, help_text");

  const saved = {};
  for (const item of data || []) saved[item.field_id] = item.help_text || "";

  const fields = [];
  sections.forEach((section, sectionIndex) => {
    section.fields.forEach((field, fieldIndex) => {
      fields.push({
        field_id: field.id,
        question: `${sectionIndex + 1}.${fieldIndex + 1}`,
        section: section.title,
        label: field.label,
        default_help: defaultHelpTexts[field.id] || field.help || "",
        help_text: saved[field.id] || defaultHelpTexts[field.id] || field.help || ""
      });
    });
  });

  return Response.json({ fields });
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [];

  for (const item of items) {
    if (!item.field_id) continue;
    await supabaseAdmin
      .from("form_help_texts")
      .upsert({
        field_id: item.field_id,
        help_text: item.help_text || "",
        updated_at: new Date().toISOString()
      }, { onConflict: "field_id" });
  }

  return Response.json({ ok: true });
}
