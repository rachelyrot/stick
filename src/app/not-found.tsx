import { ButtonLink, Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="font-latin text-8xl italic text-taupe">404</p>
      <h1 className="mt-4 font-display text-4xl">העמוד הזה נחתך החוצה</h1>
      <p className="mt-3 text-cocoa">אבל יש לנו הרבה דברים אחרים לעצב.</p>
      <ButtonLink href="/" className="mt-8">
        לדף הבית
      </ButtonLink>
    </Container>
  );
}
