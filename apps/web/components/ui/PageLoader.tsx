import Loader from "./Loader";

type Props = { message?: string };

export default function PageLoader({ message = "Loading..." }: Props) {
  return (
    <main
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-6"
    >
      <Loader />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </main>
  );
}
