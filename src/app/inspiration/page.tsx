import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/primitives";
import { InspirationGrid } from "@/features/catalog/InspirationGrid";

export const metadata: Metadata = { title: "גלריית השראה" };

export default function InspirationPage() {
  return (
    <>
      <PageHeader
        eyebrow="השראה"
        title="רעיונות שמחכים להפוך לשלכם"
        sub="בקבוקים, צנצנות, אריזות, דלתות וחלונות — וזו רק ההתחלה. בחרו רעיון, פתחו אותו בסטודיו ושנו כל פרט. אפשר גם לראות אותו על תמונה של החפץ שלכם."
      />
      <Container>
        <InspirationGrid />
      </Container>
    </>
  );
}
